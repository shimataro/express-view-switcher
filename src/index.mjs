export default viewSwitcher;

import path from "path";
import fs from "fs";

// root directory keys for view engine
const rootKeys = {
	pug: "basedir", // Pug - https://pugjs.org/
};

/**
 * view-switcher middleware
 * @param {CandidatesListGenerator} candidatesListGenerator
 * @param {?string} rootKey
 * @return {ExpressMiddleware}
 */
function viewSwitcher(candidatesListGenerator, rootKey = null)
{
	return (req, res, next) =>
	{
		const app = req.app;
		const engine = app.get("view engine");
		const baseDirs = _getBaseDirs(app);

		// base directory key name to be set in res.locals
		let rootKey_ = rootKey;
		if(rootKey_ === null && rootKeys.hasOwnProperty(engine))
		{
			rootKey_ = rootKeys[engine];
		}

		// replace render() method
		const render = res.render;
		res.render = (view, ...args) =>
		{
			const candidatesList = candidatesListGenerator(req);
			_findViewDirectory(baseDirs, candidatesList, view, engine)
				.then(([basedir, dir]) =>
				{
					if(rootKey_ !== null)
					{
						res.locals[rootKey_] = path.join(basedir, dir);
					}

					const newView = path.join(dir, view);
					render.call(res, newView, ...args);
				})
				.catch(next);
		};

		next();
	};
}

/**
 * list up the view base directories
 * @param {ExpressApp} app
 * @return {TypeBaseDirectories}
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
 * @param {TypeCandidatesList} candidatesList candidates
 * @param {string} view view filename
 * @param {string} ext extension
 * @return {Promise.<TypeViewDirectory>}
 */
async function _findViewDirectory(baseDirs, candidatesList, view, ext)
{
	for(const baseDir of baseDirs)
	{
		for(const dir of _generateDirs(candidatesList))
		{
			// return view directory if view file exists
			const fullView = path.resolve(baseDir, dir, view);
			if(await _viewExists(fullView, ext))
			{
				return [baseDir, dir];
			}
		}
	}
	const baseDirsString = baseDirs.join(", ");
	throw new Error(`"${view}" not found in "${baseDirsString}"`);
}

/**
 * view exists?
 * @param {string} fullView full path of view
 * @param {string} ext extension
 * @return {Promise.<boolean>} Yes/No
 */
function _viewExists(fullView, ext)
{
	return new Promise((resolve) =>
	{
		// search with extension
		fs.access(`${fullView}.${ext}`, fs.R_OK, (err) =>
		{
			if(err === null)
			{
				// found
				resolve(true);
			}

			// re-search without extension
			fs.access(fullView, fs.R_OK, (err) =>
			{
				if(err === null)
				{
					// found
					resolve(true);
				}
				else
				{
					// not found
					resolve(false);
				}
			});
		});
	});
}

/**
 * generate candidate directories
 * @generator
 * @param {TypeCandidatesList} candidatesList
 * @yield {string}
 */
function* _generateDirs(candidatesList)
{
	for(const pathArray of _generateDirsArray(candidatesList, 0))
	{
		yield pathArray.join(path.sep);
	}
}

/**
 * generate array of candidate directories
 * @generator
 * @param {TypeCandidatesList} candidatesList
 * @param {int} index
 * @yield {Candidates}
 */
function* _generateDirsArray(candidatesList, index)
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
