// example middleware
import express from "express";
import viewSwitcher from "../src/index";

/**
 * example middleware
 * @param app application
 * @returns middleware functions
 */
export default function exampleMiddleware(app: express.Application): express.RequestHandler[]
{
	Object.assign(app.locals, {
		// for pug
		basedir: "views",
		pretty: false,
	});

	return [
		dummyMiddleware,
		viewSwitcher((req) =>
		{
			return [getLanguageCandidates(req), getDeviceCandidates(req)];
		}),
	];
}

/**
 * dummy middleware
 * @param req request
 * @param res response
 * @param next next
 */
function dummyMiddleware(req: express.Request, res: express.Response, next: express.NextFunction): void
{
	next();
}

/**
 * get language candidates
 * @param req req
 * @returns language candidates
 */
function getLanguageCandidates(req: express.Request): string[]
{
	return getHeader(req, "Accept-Language") // ja,en-US;q=0.8,en;q=0.7,pl;q=0.5,pt-BR;q=0.3,de;q=0.2
		.split(",") // [ 'ja', 'en-US;q=0.8', 'en;q=0.7', 'pl;q=0.5', 'pt-BR;q=0.3', 'de;q=0.2' ]
		.map((part) =>
		{
			const [lang] = part.split(";");
			return lang;
		}) // [ 'ja', 'en-US', 'en', 'pl', 'pt-BR', 'de' ]
		.concat("ja"); // add default language
}

/**
 * get device candidates
 * @param req req
 * @returns device candidates
 */
function getDeviceCandidates(req: express.Request): string[]
{
	const userAgent = getHeader(req, "User-Agent");

	return [detectDevice(userAgent), "default"];
}

/**
 * detect device from User-Agent
 * @param userAgent User-Agent
 * @returns device
 */
function detectDevice(userAgent: string): string
{
	if(userAgent.indexOf("iPhone") !== -1)
	{
		return "smartphone";
	}
	if(userAgent.indexOf("iPod touch") !== -1)
	{
		return "smartphone";
	}

	if(userAgent.indexOf("iPad") !== -1)
	{
		return "tablet";
	}

	if(userAgent.indexOf("Android") !== -1)
	{
		if(userAgent.indexOf("Mobile") === -1)
		{
			return "tablet";
		}
		else
		{
			return "smartphone";
		}
	}

	return "default";
}

/**
 * get request header
 * @param req req
 * @param name header name
 * @param defaultValue default value
 * @returns request header
 */
function getHeader(req: express.Request, name: string, defaultValue = ""): string
{
	const header = req.header(name);
	if(header === undefined)
	{
		return defaultValue;
	}

	return header;
}
