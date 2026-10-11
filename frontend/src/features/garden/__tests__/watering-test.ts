import {
  daysUntilWatering,
  gardenSummary,
  lastWateredLabel,
  listPlantNames,
  plantsNeedingWater,
  roomSummary,
  sortByNextWatering,
  wateringStatus,
} from '@/features/garden/watering';
import type { GardenPlant, Room } from '@/lib/garden/types';

// Dates are built in local time, so the tests pass in any time zone.
const now = new Date(2026, 9, 9, 15, 0);

// Every plant has a schedule; the due date only matters to the watering helpers, so the
// others default it to a week from now.
function plant(name: string, due: Date = new Date(2026, 9, 16), wateringFrequencyDays = 4): GardenPlant {
  return {
    id: name.toLowerCase(),
    name,
    speciesName: null,
    wateringFrequencyDays,
    lastWateredAt: null,
    nextWateringAt: due.toISOString(),
    photoUrl: null,
  };
}

function room(id: string | null, plants: GardenPlant[]): Room {
  return { id, name: id ?? 'Other plants', plants };
}

describe('daysUntilWatering', () => {
  it('counts calendar days, not 24-hour periods', () => {
    // Due early tomorrow morning: less than 24 hours away, but still "tomorrow".
    expect(daysUntilWatering(plant('Minty', new Date(2026, 9, 10, 8, 0)), now)).toBe(1);
    // Due earlier today: already past, but still "today".
    expect(daysUntilWatering(plant('Pinky', new Date(2026, 9, 9, 9, 0)), now)).toBe(0);
  });

  it('is negative when the plant is overdue', () => {
    expect(daysUntilWatering(plant('Basil', new Date(2026, 9, 7, 20, 0)), now)).toBe(-2);
  });
});

describe('wateringStatus', () => {
  it.each([
    [new Date(2026, 9, 15, 9), 'In 6 days', 'later'],
    [new Date(2026, 9, 12, 9), 'In 3 days', 'later'],
    [new Date(2026, 9, 11, 9), 'In 2 days', 'soon'],
    [new Date(2026, 9, 10, 9), 'Tomorrow', 'tomorrow'],
    [new Date(2026, 9, 9, 9), 'Today', 'due'],
    [new Date(2026, 9, 8, 9), 'Overdue', 'due'],
    [new Date(2026, 9, 6, 9), 'Overdue', 'due'],
  ])('describes a plant due on %s as "%s"', (due, label, tone) => {
    expect(wateringStatus(plant('George', due), now)).toMatchObject({ label, tone });
  });
});

describe('plantsNeedingWater', () => {
  it('returns the plants due today or overdue across all rooms, in garden order', () => {
    const garden = {
      rooms: [
        room('balcony', [plant('George', new Date(2026, 9, 11)), plant('Pinky', new Date(2026, 9, 9))]),
        room('kitchen', [plant('Basil', new Date(2026, 9, 8)), plant('Minty', new Date(2026, 9, 10))]),
        room(null, [plant('Stray', new Date(2026, 9, 12))]),
      ],
    };

    expect(plantsNeedingWater(garden, now).map((p) => p.name)).toEqual(['Pinky', 'Basil']);
  });
});

describe('sortByNextWatering', () => {
  it('puts the plant due soonest first, whatever its watering interval', () => {
    const plants = [
      plant('Ggg', new Date(2026, 10, 7), 30), // in 29 days
      plant('Nig', new Date(2026, 9, 15), 7), // in 6 days
      plant('A', new Date(2026, 9, 17), 8), // in 8 days
    ];

    expect(sortByNextWatering(plants, now).map((p) => p.name)).toEqual(['Nig', 'A', 'Ggg']);
  });

  it('puts overdue plants first', () => {
    const plants = [
      plant('Pinky', new Date(2026, 9, 9)),
      plant('Basil', new Date(2026, 9, 7)),
      plant('Minty', new Date(2026, 9, 10)),
    ];

    expect(sortByNextWatering(plants, now).map((p) => p.name)).toEqual(['Basil', 'Pinky', 'Minty']);
  });

  it('orders plants due on the same day by name', () => {
    const plants = [
      plant('Rosie', new Date(2026, 9, 12)),
      plant('Monty', new Date(2026, 9, 12)),
    ];

    expect(sortByNextWatering(plants, now).map((p) => p.name)).toEqual(['Monty', 'Rosie']);
  });

  it('leaves the original list as it was', () => {
    const plants = [plant('Rosie', new Date(2026, 9, 12)), plant('Basil', new Date(2026, 9, 7))];

    sortByNextWatering(plants, now);

    expect(plants.map((p) => p.name)).toEqual(['Rosie', 'Basil']);
  });
});

describe('gardenSummary', () => {
  it('counts plants and rooms', () => {
    const garden = { rooms: [room('a', [plant('George')]), room('b', [plant('Pinky'), plant('Monty')])] };

    expect(gardenSummary(garden)).toBe('3 plants in 2 rooms');
  });

  it('uses the singular for one plant in one room', () => {
    expect(gardenSummary({ rooms: [room('a', [plant('George')])] })).toBe('1 plant in 1 room');
  });

  it('does not count the group of plants without a room as a room', () => {
    const garden = { rooms: [room('a', [plant('George')]), room(null, [plant('Stray')])] };

    expect(gardenSummary(garden)).toBe('2 plants in 1 room');
    expect(gardenSummary({ rooms: [room(null, [plant('Stray')])] })).toBe('1 plant');
  });
});

describe('roomSummary', () => {
  it('counts the plants and how many of them need water', () => {
    const kitchen = room('kitchen', [
      plant('Basil', new Date(2026, 9, 8)),
      plant('Rosie', new Date(2026, 9, 12)),
      plant('Minty', new Date(2026, 9, 9)),
    ]);

    expect(roomSummary(kitchen, now)).toBe('3 plants · 2 need water');
    expect(roomSummary(room('balcony', [plant('Pinky', new Date(2026, 9, 9))]), now)).toBe('1 plant · 1 needs water');
  });

  it('only counts the plants when none need water', () => {
    expect(roomSummary(room('living', [plant('Monty', new Date(2026, 9, 14))]), now)).toBe('1 plant');
    expect(roomSummary(room('empty', []), now)).toBe('0 plants');
  });
});

describe('listPlantNames', () => {
  it.each([
    [['Pinky'], 'Pinky'],
    [['Pinky', 'Basil'], 'Pinky and Basil'],
    [['Pinky', 'Basil', 'Minty'], 'Pinky, Basil and Minty'],
    [['Pinky', 'Basil', 'Minty', 'Rosie'], 'Pinky, Basil and 2 more'],
  ])('lists %j as "%s"', (names, expected) => {
    expect(listPlantNames(names.map((name) => plant(name)))).toBe(expected);
  });
});

describe('lastWateredLabel', () => {
  it('says how many calendar days ago the plant was watered', () => {
    expect(lastWateredLabel(new Date(2026, 9, 9, 8, 0).toISOString(), now)).toBe('Today');
    expect(lastWateredLabel(new Date(2026, 9, 8, 23, 0).toISOString(), now)).toBe('Yesterday');
    expect(lastWateredLabel(new Date(2026, 9, 6, 16, 0).toISOString(), now)).toBe('3 days ago');
  });

  it('says "Not yet" for a plant that was never watered', () => {
    expect(lastWateredLabel(null, now)).toBe('Not yet');
  });
});
