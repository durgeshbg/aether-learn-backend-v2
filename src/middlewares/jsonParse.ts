import type { Application } from 'express';
import express from 'express';

export const useJsonParse = (app: Application) => {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
};
