import express from 'express';
import SparringService from '../services/sparringService';

class SparringController {
    private sparringService: SparringService;

    constructor() {
        this.sparringService = new SparringService();
    }

    async createSparring(req: express.Request, res: express.Response) {
        try {
            const sparring = await this.sparringService.createSparring(req.body);
            res.status(201).send(sparring);
        } catch (error) {
            res.status(500).send({ error: 'Failed to create sparring' });
        }
    }

    async getSparring(req: express.Request, res: express.Response) {
        try {
            const sparringId = req.params.id;
            const sparringIdNumber = parseInt(sparringId, 10);
            const sparring = await this.sparringService.getSparring(sparringIdNumber);
            res.status(200).send(sparring);
        } catch (error) {
            res.status(500).send({ error: 'Failed to fetch sparring' });
        }
    }

    async updateSparring(req: express.Request, res: express.Response) {
        try {
            const sparringId = req.params.id;
            const sparringIdNumber = parseInt(sparringId, 10);
            const sparring = await this.sparringService.updateSparring(sparringIdNumber, req.body);
            res.status(200).send(sparring);
        } catch (error) {
            res.status(500).send({ error: 'Failed to update sparring' });
        }
    }

    async deleteSparring(req: express.Request, res: express.Response) {
        try {
            const sparringId = parseInt(req.params.id, 10);
            await this.sparringService.deleteSparring(sparringId);
            res.status(200).send({ message: `Sparring with ID ${sparringId} deleted successfully` });
        } catch (error) {
            res.status(500).send({ error: 'Failed to delete sparring' });
        }
    }
}

export default SparringController;