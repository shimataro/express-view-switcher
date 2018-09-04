declare module "express-view-switcher" {
    export = expressViewSwitcher

    import * as e from "express";
    function expressViewSwitcher(candidatesListGenerator: CandidatesListGenerator, rootKey?: string | null /* = null */): e.RequestHandler;
    type Candidates = string[]
    type CandidatesList = Candidates[]
    type CandidatesListGenerator = (req: e.Request) => CandidatesList
}
