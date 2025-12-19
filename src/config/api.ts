export const API_ENDPOINTS = {
  AUTH: 'https://functions.poehali.dev/6c69810c-ae4a-4732-9166-e7e99f45783e',
  USERS: 'https://functions.poehali.dev/4948a11e-7e5e-48cc-9dca-fd4ba9a68a5e',
  COURSES: 'https://functions.poehali.dev/345637fa-dc7d-4057-9465-76883124a707',
  LESSONS: 'https://functions.poehali.dev/4b4f6967-fa51-4a88-b122-89812e260126',
  TESTS: 'https://functions.poehali.dev/a2077f4f-8e3e-4c2a-b24c-883317ccd3c5',
  ASSIGNMENTS: 'https://functions.poehali.dev/7d68a42a-1d58-4081-ad4a-71c29f135926',
  PROGRESS: 'https://functions.poehali.dev/e0ccef20-8709-436a-83e2-b219771219df',
  REWARDS: 'https://functions.poehali.dev/161ddb07-9094-4922-acf0-386282c693d4',
  UPLOAD: 'https://functions.poehali.dev/a4988ecb-07df-4550-8fd6-25c3210700f7',
};

export function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('authToken', token);
}

export function removeAuthToken(): void {
  localStorage.removeItem('authToken');
}

export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'X-Auth-Token': token } : {}),
  };
}