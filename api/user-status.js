var dayjs = require("dayjs")
var utc = require('dayjs/plugin/utc')
var timezone = require('dayjs/plugin/timezone')

const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');

dayjs.extend(utc);
dayjs.extend(timezone);

const password = process.env.MONGODB_ADMIN_PASS;

mongoose.connect(`mongodb+srv://admin:${password}@cluster0.krz1f.mongodb.net/uptime?retryWrites=true&w=majority`, 
                  {useNewUrlParser: true, useUnifiedTopology: true});

const db = mongoose.connection;
autoIncrement.initialize(db);

const User = require('../db/UserModel');
const UserStatus = require('../db/UserStatusModel');

function getUserStatusById(userid, limit = 50) {
  return User.findOne({id: userid}, {username: 1, name: 1}).then(user => {
    if(!user) {
      return Promise.resolve([]);
    }

    let periodInDays = 7; // fetch user statuses within this period (in days)

    let nzdt = dayjs(new Date()).tz("Pacific/Auckland").subtract(periodInDays, 'day').hour(0);

    let startDate = dayjs.utc(nzdt).format();

    return Promise.all([
      user,
      UserStatus.find({username: user.username, createdAt: {$gte: startDate}}, {createdAt: 1, status: 1, _id: 0}).sort({createdAt: -1}).lean()
    ]).then(values => {

      let statuses = values[1];
      
      let days = getDays(statuses);

      return [user, days];
      
    });
  });
}

function getHourMinute(date) {
  let d = new Date(date);
  return `${('0' + d.getHours()).slice(-2)}:${('0' + d.getMinutes()).slice(-2)}`;
}

function getDayMonthYear(ms) {
  return getDayMonth(ms) + '/' + (new Date(ms).getFullYear());
}

function getDayMonth(date) {
  let d = new Date(date);
  let dayMonth = `${d.getDate()}/${d.getMonth() + 1}`;
  return dayMonth;  
}

function getDays(statuses) {

  // Model:
  // let res = {
  // 	days : {
  // 		'11/02/2021': {
  // 			hours: {
  // 				'08:00': {
  // 					status: {
  // 						online: 5, 
  // 						offline: 7
  // 					}
  // 				},
  // 				'07:00': {
  // 					status: {
  // 						online: 0,
  // 						offline: 12
  // 					}
  // 				},
  // 				...
  // 			}
  
  let days = {};

  for (let s of statuses) {

    let date = new Date((new Date(s.createdAt)).toLocaleString('en-US', { timeZone: 'Pacific/Auckland' }));
    let dayMonthYear = getDayMonthYear(date);

    if (!(dayMonthYear in days)) {
      days[dayMonthYear] = {};
    }

    let day = days[dayMonthYear];

    if (!('hours' in day)) {
      day['hours'] = {};
    }

    date.setMinutes(0);
    let hourMinute = getHourMinute(date);

    if (!(hourMinute in day.hours)) {
      day.hours[hourMinute] = {
        online: 0,
        offline: 0
      };
    }

    day.hours[hourMinute][s.status] = (day.hours[hourMinute][s.status] || 0) + 1
  }

  return days;
}

module.exports = async (req, res) => {
  if(req.query.api_key != process.env.API_KEY) {
    return res.status(403).send(); 
  }
  let userStatuses = [];
  if(req.query.id) {
    [user, userStatuses] = await getUserStatusById(req.query.id);    
    console.log(userStatuses.length);
    res.status(200).send({
      name: user.name,
      username: user.username,
      userStatuses
    });
  } else {
    res.status(200).send({userStatuses});
  }
};