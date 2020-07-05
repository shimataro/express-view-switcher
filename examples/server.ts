import express from "express";
import exampleMiddleware from "./middleware";

express().use(exampleMiddleware);
