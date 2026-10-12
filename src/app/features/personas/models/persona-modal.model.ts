import { PersonaCreateRequest, PersonaUpdateRequest } from './persona.model';

export type PersonaFormSubmit =
  | {
      readonly mode: 'create';
      readonly request: PersonaCreateRequest;
      readonly photo: File | null;
    }
  | {
      readonly mode: 'edit';
      readonly request: PersonaUpdateRequest;
      readonly photo: File | null;
    };

export interface PersonaUserCreateSubmit {
  readonly login: string;
  readonly password: string;
}
