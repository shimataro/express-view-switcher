import path from "path";
import fs from "fs";

import express from "express";

type Candidates = string[]
type CandidatesList = Candidates[]
type CandidatesListGenerator = (req: express.Request) => CandidatesList

type BaseDirectories = string[]
type ViewDirectory = [string, string]

// root directory keys for view engine
const rootKeys: Record<string, string> = {
	pug: "basedir", // Pug - https://pugjs.org/
};

/**
 * view-switcher middleware
 * @param candidatesListGenerator generator for candidates list
 * @param rootKey root key for view engine
 * @returns middleware function
 */
export default function viewSwitcher(candidatesListGenerator: CandidatesListGenerator, rootKey: string | null = null): express.RequestHandler
{
	return (req, res, next) =>
	{
		const {app} = req;
		const engine = app.get("view engine");
		const baseDirs = getBaseDirs(app);

		// base directory key name to be set in res.locals
		let rootKey_ = rootKey;
		if(rootKey_ === null && rootKeys.hasOwnProperty(engine))
		{
			rootKey_ = rootKeys[engine];
		}

		// replace render() method
		const {render} = res;
		res.render = (view: string, ...args: unknown[]) =>
		{
			const candidatesList = candidatesListGenerator(req);
			findViewDirectory(baseDirs, candidatesList, view, engine)
				.then((result) =>
				{
					if(result === null)
					{
						// use default settings when view is missing
						Reflect.apply(render, res, [view, ...args]);
						return;
					}

					const [basedir, dir] = result;
					if(rootKey_ !== null)
					{
						res.locals[rootKey_] = path.join(basedir, dir);
					}

					const newView = path.join(dir, view);
					Reflect.apply(render, res, [newView, ...args]);
				})
				.catch(next);
		};

		next();
	};
}

/**
 * list up the view base directories
 * @param app application
 * @returns directories
 */
function getBaseDirs(app: express.Application): BaseDirectories
{
	const views = app.get("views");
	if(Array.isArray(views))
	{
		return views;
	}
	else
	{
		return [views];
	}
}

/**
 * get the directory of the view
 * @param baseDirs base directory
 * @param candidatesList list of candidates
 * @param view view filename
 * @param ext extension
 * @returns directories
 */
async function findViewDirectory(baseDirs: BaseDirectories, candidatesList: CandidatesList, view: string, ext: string): Promise<ViewDirectory | null>
{
	for(const baseDir of baseDirs)
	{
		for(const candidateDir of generateDirs(candidatesList))
		{
			// return view directory if view file exists
			if(await viewExists(baseDir, candidateDir, view, ext))
			{
				return [baseDir, candidateDir];
			}
		}
	}

	// not found
	return null;
}

/**
 * view exists?
 * @param baseDir base directory
 * @param candidateDir candidate directory after baseDir
 * @param view view file
 * @param ext extension
 * @returns Yes/No
 */
function viewExists(baseDir: string, candidateDir: string, view: string, ext: string): Promise<boolean>
{
	let resolvedView = path.resolve(baseDir, candidateDir, view);
	if(!hasExtension(resolvedView))
	{
		resolvedView += `.${ext}`;
	}

	return new Promise((resolve) =>
	{
		fs.access(resolvedView, fs.constants.R_OK, (err) =>
		{
			resolve(err === null);
		});
	});
}

/**
 * generate candidate directories
 * @generator
 * @param candidatesList list of candidates
 * @yields directories
 */
function *generateDirs(candidatesList: CandidatesList): Generator<string>
{
	for(const pathArray of generateDirsArray(candidatesList, 0))
	{
		yield pathArray.join(path.sep);
	}
}

/**
 * generate array of candidate directories
 * @generator
 * @param candidatesList list of candidates
 * @param index index of candidatesList
 * @yields candidates
 */
function *generateDirsArray(candidatesList: CandidatesList, index: number): Generator<Candidates, void>
{
	if(index >= candidatesList.length)
	{
		yield [];
		return;
	}

	for(const element of candidatesList[index])
	{
		for(const remains of generateDirsArray(candidatesList, index + 1))
		{
			yield [element].concat(remains);
		}
	}
}

/**
 * path has extension?
 * @param pathName path name to check
 * @returns Yes/No
 */
function hasExtension(pathName: string): boolean
{
	return path.extname(pathName).length > 0;
}
