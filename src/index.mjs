export default viewSwitcher;

import path from "path";
import fs from "fs";
import util from "util";

// use fs.promises on Node.js v10
const access = util.promisify(fs.access);

// root directory keys for view engine
const rootKeys = {
	pug: "basedir", // Pug - https://pugjs.org/
};

/**
 * view-switcher middleware
 * @param {CandidatesListGenerator} candidatesListGenerator generator for candidates list
 * @param {?string} rootKey root key for view engine
 * @returns {ExpressMiddleware} middleware function
 */
function viewSwitcher(candidatesListGenerator, rootKey = null)
{
	return (req, res, next) =>
	{
		const {app} = req;
		const engine = app.get("view engine");
		const baseDirs = _getBaseDirs(app);

		// base directory key name to be set in res.locals
		let rootKey_ = rootKey;
		if(rootKey_ === null && rootKeys.hasOwnProperty(engine))
		{
			rootKey_ = rootKeys[engine];
		}

		// replace render() method
		const {render} = res;
		res.render = (view, ...args) =>
		{
			const candidatesList = candidatesListGenerator(req);
			_findViewDirectory(baseDirs, candidatesList, view, engine)
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
 * @param {ExpressApp} app application
 * @returns {TypeBaseDirectories} directories
 */
function _getBaseDirs(app)
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
 * @param {TypeBaseDirectories} baseDirs base directory
 * @param {TypeCandidatesList} candidatesList list of candidates
 * @param {string} view view filename
 * @param {string} ext extension
 * @returns {Promise.<TypeViewDirectory | null>} directories
 */
async function _findViewDirectory(baseDirs, candidatesList, view, ext)
{
	for(const baseDir of baseDirs)
	{
		for(const candidateDir of _generateDirs(candidatesList))
		{
			// return view directory if view file exists
			if(await _viewExists(baseDir, candidateDir, view, ext))
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
 * @param {string} baseDir base directory
 * @param {string} candidateDir candidate directory after baseDir
 * @param {string} view view file
 * @param {string} ext extension
 * @returns {Promise.<boolean>} Yes/No
 */
async function _viewExists(baseDir, candidateDir, view, ext)
{
	const resolvedView = path.resolve(baseDir, candidateDir, view);

	// search with extension
	try
	{
		await access(`${resolvedView}.${ext}`, fs.R_OK);
		return true;
	}
	catch(err)
	{
		// fall through
	}

	// re-search without extension
	try
	{
		await access(resolvedView, fs.R_OK);
		return true;
	}
	catch(err)
	{
		// fall through
	}

	// returns false when no views found
	return false;
}

/**
 * generate candidate directories
 * @generator
 * @param {TypeCandidatesList} candidatesList list of candidates
 * @yield {string} directories
 * @returns {void} no values
 */
function *_generateDirs(candidatesList)
{
	for(const pathArray of _generateDirsArray(candidatesList, 0))
	{
		yield pathArray.join(path.sep);
	}
}

/**
 * generate array of candidate directories
 * @generator
 * @param {TypeCandidatesList} candidatesList list of candidates
 * @param {int} index index of candidatesList
 * @yield {Candidates} candidates
 * @returns {void} no values
 */
function *_generateDirsArray(candidatesList, index)
{
	if(index >= candidatesList.length)
	{
		yield [];
		return;
	}

	for(const element of candidatesList[index])
	{
		for(const remains of _generateDirsArray(candidatesList, index + 1))
		{
			yield [element].concat(remains);
		}
	}
}

/**
 * @typedef {(ExpressMiddlewareNormal|ExpressMiddlewareError)} ExpressMiddleware
 */
/**
 * @callback ExpressMiddlewareNormal
 * @param {ExpressReq} req
 * @param {ExpressRes} res
 * @param {ExpressMiddleware} next
 */
/**
 * @callback ExpressMiddlewareError
 * @param {Error} err
 * @param {ExpressReq} req
 * @param {ExpressRes} res
 * @param {ExpressMiddleware} next
 */
/**
 * @typedef {Object} ExpressApp
 * @property {Function} get
 */
/**
 * @typedef {Object} ExpressReq
 * @property {ExpressApp} app
 */
/**
 * @typedef {Object} ExpressRes
 * @property {Function} render
 * @property {Object} locals
 */

/**
 * @typedef {string[]} TypeCandidates
 */
/**
 * @typedef {TypeCandidates[]} TypeCandidatesList
 */
/**
 * @callback CandidatesListGenerator
 * @param {ExpressReq} req
 * @return {TypeCandidatesList}
 */
/**
 * @typedef {string[]} TypeBaseDirectories
 */
/**
 * @typedef {[string, string]} TypeViewDirectory
 */
