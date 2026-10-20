import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { useGarden } from '@/features/garden/use-garden';
import { usePlanterActions } from '@/features/planters/use-planter-actions';
import { usePlantActions } from '@/features/plants/use-plant-actions';
import { useDiscoveredSpecies } from '@/features/species/use-discovered-species';
import { useSpecies } from '@/features/species/use-species';
import { useOnboardingStore } from '@/stores/onboarding-store';

import { AddPlantScreen } from '../add-plant-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/features/garden/use-garden');
jest.mock('@/features/plants/use-plant-actions');
jest.mock('@/features/species/use-species');
jest.mock('@/features/species/use-discovered-species');
jest.mock('@/features/planters/use-planter-actions');
jest.mock('@/stores/onboarding-store', () => ({
  ...jest.requireActual('@/stores/onboarding-store'),
  useOnboardingStore: jest.fn(),
}));
// The real hook loads the native picker; the form's tests cover the photo.
jest.mock('@/features/photos/use-photo-upload', () => ({
  usePhotoUpload: () => ({ uri: null, key: null, isUploading: false, error: null }),
}));

const mockedUseRouter = jest.mocked(useRouter);
const mockedUsePlantActions = jest.mocked(usePlantActions);
const mockedUseGarden = jest.mocked(useGarden);
const mockedUseSpecies = jest.mocked(useSpecies);
const garden = {
  rooms: [
    { id: 'balcony', name: 'Balcony', plants: [] },
    { id: null, name: 'Other plants', plants: [] },
  ],
};
const back = jest.fn();
const push = jest.fn();
const replace = jest.fn();
const canGoBack = jest.fn();
const createPlant = jest.fn();
const onboarding = { step: null, start: jest.fn(), next: jest.fn(), skipPast: jest.fn(), finish: jest.fn() };
const user = userEvent.setup();
const vera = {
  id: 'p1',
  name: 'Vera',
  light: null,
  wateringEveryDays: null,
  notes: null,
  planterId: null,
  speciesId: null,
  photoUrl: null,
};

/** Fills in a plant named Vera of the Monstera species and saves it. */
async function addVeraAsMonstera() {
  await user.type(screen.getByLabelText('Name'), 'Vera');
  await user.type(screen.getByLabelText('Species'), 'mon');
  await user.press(screen.getByRole('button', { name: 'Monstera' }));
  await user.press(screen.getByRole('button', { name: 'Next' }));
  await user.press(screen.getByRole('button', { name: 'Add to my garden' }));
}

beforeEach(() => {
  canGoBack.mockReturnValue(true);
  jest.mocked(useOnboardingStore).mockReturnValue(onboarding);
  mockedUseRouter.mockReturnValue({ back, push, replace, canGoBack } as unknown as ReturnType<typeof useRouter>);
  mockedUsePlantActions.mockReturnValue({
    createPlant,
    updatePlant: jest.fn(),
    deletePlant: jest.fn(),
    addPlantPhoto: jest.fn(),
    updatePlantPhoto: jest.fn(),
    deletePlantPhoto: jest.fn(),
  });
  jest.mocked(usePlanterActions).mockReturnValue({ createPlanter: jest.fn(), renamePlanter: jest.fn(), deletePlanter: jest.fn() });
  mockedUseSpecies.mockReturnValue({
    species: [{ id: 's1', commonName: 'Monstera', scientificName: 'Monstera deliciosa', wateringFrequencyDays: 7, region: null, sunlightNeeds: null, common: false, imageUrl: null }],
    error: null, retry: jest.fn() });
  mockedUseGarden.mockReturnValue({ garden, error: null, isLoading: false, retry: jest.fn(), refresh: jest.fn() });
  jest.mocked(useDiscoveredSpecies).mockReturnValue({ discovered: [], error: null, isLoading: false, retry: jest.fn() });
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('AddPlantScreen', () => {

  it('closes once the plant is saved', async () => {
    createPlant.mockResolvedValue({
      id: 'p1',
      name: 'Vera',
      light: null,
      wateringEveryDays: null,
      notes: null,
      planterId: null,
      speciesId: null,
      photoUrl: null,
    });
    await render(<AddPlantScreen />);

    await user.type(screen.getByLabelText('Name'), 'Vera');
    await user.press(screen.getByRole('button', { name: 'Next' }));
    await user.press(screen.getByRole('button', { name: 'Add to my garden' }));

    await waitFor(() => expect(back).toHaveBeenCalled());
    expect(onboarding.next).not.toHaveBeenCalled();
  });

  it("during the tour's first-plant step, saving the plant moves the tour on to its page", async () => {
    jest.mocked(useOnboardingStore).mockReturnValue({ ...onboarding, step: 'plant' });
    createPlant.mockResolvedValue({ ...vera, speciesId: null });
    await render(<AddPlantScreen />);

    await user.type(screen.getByLabelText('Name'), 'Vera');
    await user.press(screen.getByRole('button', { name: 'Next' }));
    await user.press(screen.getByRole('button', { name: 'Add to my garden' }));

    await waitFor(() => expect(back).toHaveBeenCalled());
    expect(onboarding.next).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith({ pathname: '/plant/[id]', params: { id: vera.id } });
  });

  it('celebrates when the plant is the first of its species, then closes', async () => {
    createPlant.mockResolvedValue({ ...vera, speciesId: 's1' });
    await render(<AddPlantScreen />);

    await addVeraAsMonstera();

    expect(await screen.findByText('Just discovered!')).toBeOnTheScreen();
    expect(screen.getByText('#001 Monstera')).toBeOnTheScreen();
    expect(back).not.toHaveBeenCalled();
    await user.press(screen.getByRole('button', { name: 'Nice!' }));
    expect(back).toHaveBeenCalled();
  });

  it('closes straight away when the species was already discovered', async () => {
    jest.mocked(useDiscoveredSpecies).mockReturnValue({
      discovered: [{ speciesId: 's1', discoveredAt: '2026-10-11T09:30:00Z' }],
      error: null,
      isLoading: false,
      retry: jest.fn(),
    });
    createPlant.mockResolvedValue({ ...vera, speciesId: 's1' });
    await render(<AddPlantScreen />);

    await addVeraAsMonstera();

    await waitFor(() => expect(back).toHaveBeenCalled());
    expect(screen.queryByText('Just discovered!')).toBeNull();
  });
});
