import {
  daysUntilWatering,
  gardenSummary,
  lastWateredLabel,
  listPlantNames,
  plantsNeedingWater,
  roomSummary,
  sortByWaterLevel,
  wateringStatus,
} from '@/features/garden/watering';
import type { GardenPlant, Room } from '@/lib/garden/types';

// Dates are built in local time, so the tests pass in any time zone.
const now = new Date(2026, 9, 9, 15, 0);

function plant(name: string, due: Date | null, wateringFrequencyDays: number | null = 4): GardenPlant {
  return {
    id: name.toLowerCase(),
    name,
    speciesName: null,
    wateringFrequencyDays,
    lastWateredAt: null,
    nextWateringAt: due ? due.toISOString() : null,
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

  it('is null when the plant has no schedule', () => {
    expect(daysUntilWatering(plant('Mystery', null), now)).toBeNull();
  });
});

describe('wateringStatus', () => {
  it.each([
    [new Date(2026, 9, 11, 9), 'In 2 days', 'normal'],
    [new Date(2026, 9, 10, 9), 'Tomorrow', 'soon'],
    [new Date(2026, 9, 9, 9), 'Today', 'soon'],
    [new Date(2026, 9, 8, 9), 'Overdue', 'overdue'],
    [new Date(2026, 9, 6, 9), 'Overdue', 'overdue'],
  ])('describes a plant due on %s as "%s"', (due, label, tone) => {
    expect(wateringStatus(plant('George', due), now)).toMatchObject({ label, tone });
  });

  it('measures the water level as the share of the watering interval that is left', () => {
    expect(wateringStatus(plant('George', new Date(2026, 9, 11, 9), 4), now).level).toBe(0.5);
    expect(wateringStatus(plant('George', new Date(2026, 9, 13, 9), 4), now).level).toBe(1);
  });

  it('shows only a thin layer of water when the plant is due tomorrow', () => {
    expect(wateringStatus(plant('Minty', new Date(2026, 9, 10, 9), 3), now).level).toBe(0.1);
  });

  it('has no water left when the plant is due or overdue', () => {
    expect(wateringStatus(plant('Pinky', new Date(2026, 9, 9, 9)), now).level).toBe(0);
    expect(wateringStatus(plant('Basil', new Date(2026, 9, 6, 9)), now).level).toBe(0);
  });

  it('says so when the plant has no watering schedule', () => {
    expect(wateringStatus(plant('Mystery', null, null), now)).toEqual({
      label: 'No schedule',
      tone: 'none',
      level: 0,
    });
  });
});

describe('plantsNeedingWater', () => {
  it('returns the plants due today or overdue across all rooms, in garden order', () => {
    const garden = {
      rooms: [
        room('balcony', [plant('George', new Date(2026, 9, 11)), plant('Pinky', new Date(2026, 9, 9))]),
        room('kitchen', [plant('Basil', new Date(2026, 9, 8)), plant('Minty', new Date(2026, 9, 10))]),
        room(null, [plant('Mystery', null, null)]),
      ],
    };

    expect(plantsNeedingWater(garden, now).map((p) => p.name)).toEqual(['Pinky', 'Basil']);
  });
});

describe('sortByWaterLevel', () => {
  it('puts the plant with the least water first', () => {
    const plants = [
      plant('Monty', new Date(2026, 9, 14), 7), // 5 of 7 days left
      plant('Rosie', new Date(2026, 9, 12), 7), // 3 of 7
      plant('George', new Date(2026, 9, 11), 4), // 2 of 4
      plant('Minty', new Date(2026, 9, 10), 3), // tomorrow: a thin layer
    ];

    expect(sortByWaterLevel(plants, now).map((p) => p.name)).toEqual(['Minty', 'Rosie', 'George', 'Monty']);
  });

  it('puts overdue before due today when both have no water left, and unscheduled plants last', () => {
    const plants = [
      plant('Mystery', null, null),
      plant('Pinky', new Date(2026, 9, 9)),
      plant('Basil', new Date(2026, 9, 7)),
      plant('Minty', new Date(2026, 9, 10)),
    ];

    expect(sortByWaterLevel(plants, now).map((p) => p.name)).toEqual(['Basil', 'Pinky', 'Minty', 'Mystery']);
  });
});

describe('gardenSummary', () => {
  it('counts plants and rooms', () => {
    const garden = { rooms: [room('a', [plant('George', null)]), room('b', [plant('Pinky', null), plant('Monty', null)])] };

    expect(gardenSummary(garden)).toBe('3 plants in 2 rooms');
  });

  it('uses the singular for one plant in one room', () => {
    expect(gardenSummary({ rooms: [room('a', [plant('George', null)])] })).toBe('1 plant in 1 room');
  });

  it('does not count the group of plants without a room as a room', () => {
    const garden = { rooms: [room('a', [plant('George', null)]), room(null, [plant('Stray', null)])] };

    expect(gardenSummary(garden)).toBe('2 plants in 1 room');
    expect(gardenSummary({ rooms: [room(null, [plant('Stray', null)])] })).toBe('1 plant');
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
    expect(listPlantNames(names.map((name) => plant(name, null)))).toBe(expected);
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
