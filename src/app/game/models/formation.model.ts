import { Position } from './position.model';

export type FormationShape =
  | '4-4-2'
  | '4-3-3'
  | '4-2-3-1'
  | '4-2-3-1-narrow'
  | '3-5-2'
  | '3-4-3'
  | '5-3-2'
  | '5-4-1'
  | '4-5-1'
  | '4-1-4-1'
  | '4-4-1-1';

export type FormationStyle = 'defensive' | 'normal' | 'offensive';

export interface FormationSlot {
  id: string;
  label: string;
  allowed: Position[];
  /** Horizontal coordinate on the pitch (0 = left touchline, 100 = right). */
  x: number;
  /** Vertical coordinate on the pitch (0 = own goal, 100 = opponent goal). */
  y: number;
}

export interface FormationModifiers {
  attack: number;
  midfield: number;
  defense: number;
}

export interface Formation {
  id: string;
  shape: FormationShape;
  style: FormationStyle;
  slots: FormationSlot[];
  modifiers: FormationModifiers;
}
