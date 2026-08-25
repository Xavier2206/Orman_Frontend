import { PersonaRequest } from './persona.model';

export interface PersonaFormSubmit {
  readonly request: PersonaRequest;
  readonly photo: File | null;
}

export interface PersonaUserCreateSubmit {
  readonly login: string;
  readonly password: string;
}
