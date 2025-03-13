import { Gym } from '../models/gymModel';

const gyms: Gym[] = [];

export class GymService {
    createGym(gym: Gym): Gym {
        gyms.push(gym);
        return gym;
    }

    getGym(id: number): Gym | undefined {
        return gyms.find(gym => gym.id === id);
    }

    updateGym(id: number, updatedGym: Partial<Gym>): Gym | undefined {
        const gymIndex = gyms.findIndex(gym => gym.id === id);
        if (gymIndex !== -1) {
            gyms[gymIndex] = { ...gyms[gymIndex], ...updatedGym };
            return gyms[gymIndex];
        }
        return undefined;
    }

    deleteGym(id: number): boolean {
        const gymIndex = gyms.findIndex(gym => gym.id === id);
        if (gymIndex !== -1) {
            gyms.splice(gymIndex, 1);
            return true;
        }
        return false;
    }

    getAllGyms(): Gym[] {
        return gyms;
    }
}