// Application Context (set up dependency injections)


// Services:
const classifyMoodService = require('./service/mockClassifyMoodService');
const locationService = require('./service/mockLocationService');


// Models:
const captureModel = require('./model/captureModel');
const locationModel = require('./model/locationModel');
const moodModel = require('./model/moodModel');


// Business Tier:
const captureBusinessDI = require('./business/captureBusiness');
const moodBusinessDI = require('./business/moodBusiness');
const jwtBusiness = require('./business/jwtBusiness');

// Routes
const apiDi = require('./routes/api');


const context = {
  service: { classifyMoodService, locationService },
  model: { captureModel, locationModel, moodModel },
  business: {
    captureBusiness: captureBusinessDI(moodModel, captureModel, locationModel, classifyMoodService, locationService),
    moodBusiness: moodBusinessDI(moodModel, captureModel, locationModel),
    jwtBusiness,
  },
  routes: {},
};

context.routes.api = apiDi(context.business.captureBusiness, context.business.moodBusiness, jwtBusiness);


module.exports = context;
