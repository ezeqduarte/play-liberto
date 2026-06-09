import {
  Formation,
  FormationModifiers,
  FormationShape,
  FormationSlot,
  FormationStyle,
} from '../models/formation.model';

/**
 * 10 base shapes — each one defines its 11 slots with allowed positions
 * and pitch coordinates. From these, we generate 30 formations
 * (10 shapes × 3 styles) via the modifiers below.
 */
const SHAPE_SLOTS: Record<FormationShape, FormationSlot[]> = {
  '4-4-2': [
    { id: 'gk', label: 'GK', allowed: ['GK'], x: 50, y: 5 },
    { id: 'rb', label: 'RB', allowed: ['RB'], x: 85, y: 25 },
    { id: 'cb-r', label: 'CB', allowed: ['CB'], x: 60, y: 20 },
    { id: 'cb-l', label: 'CB', allowed: ['CB'], x: 40, y: 20 },
    { id: 'lb', label: 'LB', allowed: ['LB'], x: 15, y: 25 },
    { id: 'rm', label: 'RM', allowed: ['RM', 'RW'], x: 85, y: 55 },
    { id: 'cm-r', label: 'CM', allowed: ['CM', 'CDM', 'CAM'], x: 60, y: 50 },
    { id: 'cm-l', label: 'CM', allowed: ['CM', 'CDM', 'CAM'], x: 40, y: 50 },
    { id: 'lm', label: 'LM', allowed: ['LM', 'LW'], x: 15, y: 55 },
    { id: 'st-r', label: 'ST', allowed: ['ST', 'CF'], x: 60, y: 85 },
    { id: 'st-l', label: 'ST', allowed: ['ST', 'CF'], x: 40, y: 85 },
  ],
  '4-3-3': [
    { id: 'gk', label: 'GK', allowed: ['GK'], x: 50, y: 5 },
    { id: 'rb', label: 'RB', allowed: ['RB'], x: 85, y: 25 },
    { id: 'cb-r', label: 'CB', allowed: ['CB'], x: 60, y: 20 },
    { id: 'cb-l', label: 'CB', allowed: ['CB'], x: 40, y: 20 },
    { id: 'lb', label: 'LB', allowed: ['LB'], x: 15, y: 25 },
    { id: 'cdm', label: 'CDM', allowed: ['CDM', 'CM'], x: 50, y: 45 },
    { id: 'cm-r', label: 'CM', allowed: ['CM', 'CAM', 'CDM'], x: 65, y: 55 },
    { id: 'cm-l', label: 'CM', allowed: ['CM', 'CAM', 'CDM'], x: 35, y: 55 },
    { id: 'rw', label: 'RW', allowed: ['RW', 'RM'], x: 80, y: 80 },
    { id: 'st', label: 'ST', allowed: ['ST', 'CF'], x: 50, y: 88 },
    { id: 'lw', label: 'LW', allowed: ['LW', 'LM'], x: 20, y: 80 },
  ],
  '4-2-3-1': [
    { id: 'gk', label: 'GK', allowed: ['GK'], x: 50, y: 5 },
    { id: 'rb', label: 'RB', allowed: ['RB'], x: 85, y: 25 },
    { id: 'cb-r', label: 'CB', allowed: ['CB'], x: 60, y: 20 },
    { id: 'cb-l', label: 'CB', allowed: ['CB'], x: 40, y: 20 },
    { id: 'lb', label: 'LB', allowed: ['LB'], x: 15, y: 25 },
    { id: 'cdm-r', label: 'CDM', allowed: ['CDM', 'CM'], x: 65, y: 45 },
    { id: 'cdm-l', label: 'CDM', allowed: ['CDM', 'CM'], x: 35, y: 45 },
    { id: 'cam', label: 'CAM', allowed: ['CAM', 'CM'], x: 50, y: 67 },
    { id: 'rw', label: 'RW', allowed: ['RW', 'RM'], x: 80, y: 70 },
    { id: 'lw', label: 'LW', allowed: ['LW', 'LM'], x: 20, y: 70 },
    { id: 'st', label: 'ST', allowed: ['ST', 'CF'], x: 50, y: 88 },
  ],
  '3-5-2': [
    { id: 'gk', label: 'GK', allowed: ['GK'], x: 50, y: 5 },
    { id: 'cb-r', label: 'CB', allowed: ['CB'], x: 75, y: 25 },
    { id: 'cb-c', label: 'CB', allowed: ['CB'], x: 50, y: 20 },
    { id: 'cb-l', label: 'CB', allowed: ['CB'], x: 25, y: 25 },
    { id: 'rm', label: 'RM', allowed: ['RM', 'RW', 'RB'], x: 90, y: 55 },
    { id: 'cm-r', label: 'CM', allowed: ['CM', 'CDM', 'CAM'], x: 65, y: 55 },
    { id: 'cm-c', label: 'CM', allowed: ['CM', 'CDM'], x: 50, y: 50 },
    { id: 'cm-l', label: 'CM', allowed: ['CM', 'CDM', 'CAM'], x: 35, y: 55 },
    { id: 'lm', label: 'LM', allowed: ['LM', 'LW', 'LB'], x: 10, y: 55 },
    { id: 'st-r', label: 'ST', allowed: ['ST', 'CF'], x: 60, y: 85 },
    { id: 'st-l', label: 'ST', allowed: ['ST', 'CF'], x: 40, y: 85 },
  ],
  '3-4-3': [
    { id: 'gk', label: 'GK', allowed: ['GK'], x: 50, y: 5 },
    { id: 'cb-r', label: 'CB', allowed: ['CB'], x: 75, y: 25 },
    { id: 'cb-c', label: 'CB', allowed: ['CB'], x: 50, y: 20 },
    { id: 'cb-l', label: 'CB', allowed: ['CB'], x: 25, y: 25 },
    { id: 'rm', label: 'RM', allowed: ['RM', 'RW', 'RB'], x: 85, y: 55 },
    { id: 'cm-r', label: 'CM', allowed: ['CM', 'CDM', 'CAM'], x: 60, y: 50 },
    { id: 'cm-l', label: 'CM', allowed: ['CM', 'CDM', 'CAM'], x: 40, y: 50 },
    { id: 'lm', label: 'LM', allowed: ['LM', 'LW', 'LB'], x: 15, y: 55 },
    { id: 'rw', label: 'RW', allowed: ['RW', 'RM'], x: 80, y: 85 },
    { id: 'st', label: 'ST', allowed: ['ST', 'CF'], x: 50, y: 88 },
    { id: 'lw', label: 'LW', allowed: ['LW', 'LM'], x: 20, y: 85 },
  ],
  '5-3-2': [
    { id: 'gk', label: 'GK', allowed: ['GK'], x: 50, y: 5 },
    { id: 'rb', label: 'RB', allowed: ['RB', 'RM'], x: 90, y: 30 },
    { id: 'cb-r', label: 'CB', allowed: ['CB'], x: 70, y: 22 },
    { id: 'cb-c', label: 'CB', allowed: ['CB'], x: 50, y: 18 },
    { id: 'cb-l', label: 'CB', allowed: ['CB'], x: 30, y: 22 },
    { id: 'lb', label: 'LB', allowed: ['LB', 'LM'], x: 10, y: 30 },
    { id: 'cm-r', label: 'CM', allowed: ['CM', 'CDM', 'CAM'], x: 65, y: 55 },
    { id: 'cm-c', label: 'CM', allowed: ['CM', 'CDM'], x: 50, y: 50 },
    { id: 'cm-l', label: 'CM', allowed: ['CM', 'CDM', 'CAM'], x: 35, y: 55 },
    { id: 'st-r', label: 'ST', allowed: ['ST', 'CF'], x: 60, y: 85 },
    { id: 'st-l', label: 'ST', allowed: ['ST', 'CF'], x: 40, y: 85 },
  ],
  '5-4-1': [
    { id: 'gk', label: 'GK', allowed: ['GK'], x: 50, y: 5 },
    { id: 'rb', label: 'RB', allowed: ['RB', 'RM'], x: 90, y: 30 },
    { id: 'cb-r', label: 'CB', allowed: ['CB'], x: 70, y: 22 },
    { id: 'cb-c', label: 'CB', allowed: ['CB'], x: 50, y: 18 },
    { id: 'cb-l', label: 'CB', allowed: ['CB'], x: 30, y: 22 },
    { id: 'lb', label: 'LB', allowed: ['LB', 'LM'], x: 10, y: 30 },
    { id: 'rm', label: 'RM', allowed: ['RM', 'RW'], x: 85, y: 55 },
    { id: 'cm-r', label: 'CM', allowed: ['CM', 'CDM', 'CAM'], x: 60, y: 55 },
    { id: 'cm-l', label: 'CM', allowed: ['CM', 'CDM', 'CAM'], x: 40, y: 55 },
    { id: 'lm', label: 'LM', allowed: ['LM', 'LW'], x: 15, y: 55 },
    { id: 'st', label: 'ST', allowed: ['ST', 'CF'], x: 50, y: 88 },
  ],
  '4-5-1': [
    { id: 'gk', label: 'GK', allowed: ['GK'], x: 50, y: 5 },
    { id: 'rb', label: 'RB', allowed: ['RB'], x: 85, y: 25 },
    { id: 'cb-r', label: 'CB', allowed: ['CB'], x: 60, y: 20 },
    { id: 'cb-l', label: 'CB', allowed: ['CB'], x: 40, y: 20 },
    { id: 'lb', label: 'LB', allowed: ['LB'], x: 15, y: 25 },
    { id: 'rm', label: 'RM', allowed: ['RM', 'RW'], x: 88, y: 55 },
    { id: 'cm-r', label: 'CM', allowed: ['CM', 'CDM', 'CAM'], x: 65, y: 55 },
    { id: 'cm-c', label: 'CM', allowed: ['CM', 'CDM'], x: 50, y: 50 },
    { id: 'cm-l', label: 'CM', allowed: ['CM', 'CDM', 'CAM'], x: 35, y: 55 },
    { id: 'lm', label: 'LM', allowed: ['LM', 'LW'], x: 12, y: 55 },
    { id: 'st', label: 'ST', allowed: ['ST', 'CF'], x: 50, y: 88 },
  ],
  '4-1-4-1': [
    { id: 'gk', label: 'GK', allowed: ['GK'], x: 50, y: 5 },
    { id: 'rb', label: 'RB', allowed: ['RB'], x: 85, y: 25 },
    { id: 'cb-r', label: 'CB', allowed: ['CB'], x: 60, y: 20 },
    { id: 'cb-l', label: 'CB', allowed: ['CB'], x: 40, y: 20 },
    { id: 'lb', label: 'LB', allowed: ['LB'], x: 15, y: 25 },
    { id: 'cdm', label: 'CDM', allowed: ['CDM', 'CM'], x: 50, y: 40 },
    { id: 'rm', label: 'RM', allowed: ['RM', 'RW'], x: 85, y: 65 },
    { id: 'cm-r', label: 'CM', allowed: ['CM', 'CAM'], x: 60, y: 62 },
    { id: 'cm-l', label: 'CM', allowed: ['CM', 'CAM'], x: 40, y: 62 },
    { id: 'lm', label: 'LM', allowed: ['LM', 'LW'], x: 15, y: 65 },
    { id: 'st', label: 'ST', allowed: ['ST', 'CF'], x: 50, y: 88 },
  ],
  '4-4-1-1': [
    { id: 'gk', label: 'GK', allowed: ['GK'], x: 50, y: 5 },
    { id: 'rb', label: 'RB', allowed: ['RB'], x: 85, y: 25 },
    { id: 'cb-r', label: 'CB', allowed: ['CB'], x: 60, y: 20 },
    { id: 'cb-l', label: 'CB', allowed: ['CB'], x: 40, y: 20 },
    { id: 'lb', label: 'LB', allowed: ['LB'], x: 15, y: 25 },
    { id: 'rm', label: 'RM', allowed: ['RM', 'RW'], x: 85, y: 55 },
    { id: 'cm-r', label: 'CM', allowed: ['CM', 'CDM', 'CAM'], x: 60, y: 50 },
    { id: 'cm-l', label: 'CM', allowed: ['CM', 'CDM', 'CAM'], x: 40, y: 50 },
    { id: 'lm', label: 'LM', allowed: ['LM', 'LW'], x: 15, y: 55 },
    { id: 'cam', label: 'CAM', allowed: ['CAM', 'CM'], x: 50, y: 70 },
    { id: 'st', label: 'ST', allowed: ['ST', 'CF'], x: 50, y: 88 },
  ],
};

/**
 * Tactical modifiers per style. Applied on top of squad ratings
 * inside the match simulator.
 */
const STYLE_MODIFIERS: Record<FormationStyle, FormationModifiers> = {
  defensive: { attack: -3, midfield: 0, defense: 5 },
  normal: { attack: 0, midfield: 0, defense: 0 },
  offensive: { attack: 5, midfield: 0, defense: -3 },
};

/**
 * Per-slot transformation based on the chosen style. Rather than a flat
 * vertical shift, each role behaves differently:
 *
 * - GK / CB: pinned.
 * - LB / RB: defensive narrows them in and drops them slightly; offensive
 *   pushes them out into wingback positions.
 * - CDM: defensive drops it between the CBs (back-3 sweeper); offensive
 *   pushes it up to CM line.
 * - CAM: defensive pulls it back to support the CMs; offensive pushes it
 *   right up behind the strikers.
 * - LM / RM: defensive narrows them in and drops them; offensive widens
 *   and pushes them up.
 * - LW / RW: defensive drops them to wide-mid territory; offensive
 *   pushes them up to the striker line.
 * - ST / CF: small forward/back nudge.
 */
function applyStyleShift(
  slots: FormationSlot[],
  style: FormationStyle,
): FormationSlot[] {
  if (style === 'normal') return slots;
  return slots.map((s) => transformSlotForStyle(s, style));
}

function transformSlotForStyle(
  slot: FormationSlot,
  style: FormationStyle,
): FormationSlot {
  const off = style === 'offensive';
  switch (slot.label) {
    case 'GK':
    case 'CB':
      return slot;

    case 'LB':
      return off
        ? { ...slot, x: 8, y: 45 }
        : { ...slot, x: Math.min(slot.x + 8, 30), y: Math.max(slot.y - 3, 18) };

    case 'RB':
      return off
        ? { ...slot, x: 92, y: 45 }
        : { ...slot, x: Math.max(slot.x - 8, 70), y: Math.max(slot.y - 3, 18) };

    case 'CDM':
      return off
        ? { ...slot, y: Math.min(slot.y + 12, 58) }
        : { ...slot, y: 28 };

    case 'CM':
      return off
        ? { ...slot, y: clamp(slot.y + 5, 50, 70) }
        : { ...slot, y: clamp(slot.y - 6, 32, 50) };

    case 'CAM':
      return off
        ? { ...slot, y: clamp(slot.y + 6, 65, 78) }
        : { ...slot, y: clamp(slot.y - 10, 48, 60) };

    case 'LM':
      return off
        ? { ...slot, x: Math.max(slot.x - 3, 5), y: clamp(slot.y + 6, 58, 78) }
        : { ...slot, x: Math.min(slot.x + 6, 28), y: clamp(slot.y - 5, 40, 55) };

    case 'RM':
      return off
        ? { ...slot, x: Math.min(slot.x + 3, 95), y: clamp(slot.y + 6, 58, 78) }
        : { ...slot, x: Math.max(slot.x - 6, 72), y: clamp(slot.y - 5, 40, 55) };

    case 'LW':
      return off
        ? { ...slot, x: Math.max(slot.x - 3, 8), y: clamp(slot.y + 4, 78, 92) }
        : { ...slot, x: Math.min(slot.x + 3, 25), y: clamp(slot.y - 14, 55, 70) };

    case 'RW':
      return off
        ? { ...slot, x: Math.min(slot.x + 3, 92), y: clamp(slot.y + 4, 78, 92) }
        : { ...slot, x: Math.max(slot.x - 3, 75), y: clamp(slot.y - 14, 55, 70) };

    case 'ST':
      return off
        ? { ...slot, y: clamp(slot.y + 2, 80, 93) }
        : { ...slot, y: clamp(slot.y - 5, 70, 85) };

    default:
      return slot;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

const SHAPES: FormationShape[] = [
  '4-4-2',
  '4-3-3',
  '4-2-3-1',
  '3-5-2',
  '3-4-3',
  '5-3-2',
  '5-4-1',
  '4-5-1',
  '4-1-4-1',
  '4-4-1-1',
];

const STYLES: FormationStyle[] = ['defensive', 'normal', 'offensive'];

/**
 * Builds the cartesian product of shapes × styles = 30 formations.
 */
function buildFormations(): Formation[] {
  const all: Formation[] = [];
  for (const shape of SHAPES) {
    const baseSlots = SHAPE_SLOTS[shape];
    for (const style of STYLES) {
      all.push({
        id: `${shape}-${style}`,
        shape,
        style,
        slots: applyStyleShift(baseSlots, style),
        modifiers: STYLE_MODIFIERS[style],
      });
    }
  }
  return all;
}

export const FORMATIONS: Formation[] = buildFormations();

export function getFormationById(id: string): Formation | undefined {
  return FORMATIONS.find((f) => f.id === id);
}
