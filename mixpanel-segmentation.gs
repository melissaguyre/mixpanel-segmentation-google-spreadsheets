/********************************************************************************
 * Mixpanel Segmentation Data Export
 *
 * Retrieves data from Mixpanel via the Data Export API Segmentation end point.
 *
 * @author https://github.com/melissaguyre (Melissa Guyre)
 *
 * For more information querying Mixpanel Data Export APIs see
 * https://mixpanel.com/docs/api-documentation/data-export-api
 * https://mixpanel.com/docs/api-documentation/exporting-raw-data-you-inserted-into-mixpanel
 *
 *********************************************************************************/

/**
 * Step 1) Fill in your account's Mixpanel Information here
 * Go to Settings > Project Settings to find the API Secret
 */

var API_SECRET = '';


/**
 * Step 2) Define the tab # at which to create new sheets in the spreadsheet.
 * 0 creates a new sheet as the first sheet.
 * 1 creates a new sheet at the second sheet and so forth.
 */
var CREATE_NEW_SHEETS_AT = 1;


/**
 * Step 3) Define date range as a string in format of 'yyyy-mm-dd' or '2013-09-13'
 */
var FROM_DATE = getMixpanelDateDaysAgo(2); // Returns date 2 days ago. You can change 2 to 1 to get yesterday's date
var TO_DATE   = getMixpanelDateToday();    // Returns today's date


/**
 * Step 4) Define Segmentation Queries - Get data for an event, segmented and filtered by properties.
 *
 * Format is: 'Sheet Name' : [ 'event', 'where', 'type', 'unit', 'on' ],
 *
 * For example: 'Sign Ups' : [ 'signup', '(properties["Platform"])=="iPhone" and (properties["mp_country_code"])=="GB"', 'general', 'day', properties["$device"] ],
 *
 * For full details on Segmentation Queries https://mixpanel.com/help/reference/data-export-api#segmentation
 * Sheet Name - What you want the sheet with your data to be called.
 * event  - required  -The event that you wish to segment on.
 * where  - optional  -The property expression to filter the event on. More info on expressions here : https://help.mixpanel.com/hc/en-us/articles/115005061286-How-do-I-build-segmentation-expressions-
 * type   - optional  -This can be 'general', 'unique', or 'average'.
 * unit   - optional  -This can be 'minute', 'hour', 'day', or 'month'.
 * on     - optional  -The property expression to segment the event on.
 */
var API_PARAMETERS = {
    'Sheet 1' : [ 'event', 'where', 'type', 'unit','properties["property_name"]' ],
    'Sheet 2' : [ 'signed up', '(defined (properties["$device"]))', 'general', 'hour', properties["mp_country_code"]], //example
//  'Sheet n' : [ 'event', 'where', 'type', 'unit', 'on' ],
};


/**
 * Step 5) Get Data
 *
 * In the Script Editor's "Run" menu, use the getMixpanelData() function to get data from within this script.
 *
 * Automate data pulling in the Script Editor's "Resources" menu. Select "Current Project Triggers"
 * and set up the script to run 'getMixpanelData' as a Time-driven event on a timer set by you.
 *
 * In the spreadsheet, once this script is set up you will see a new menu called "Mixpanel".
 * Select "Get Mixpanel Data" to pull data on demand.
 *
 */



/******** USER CONFIGURATION ENDS HERE: Do not edit below this line ****************/
/***********************************************************************************/
/***********************************************************************************/
/***********************************************************************************/




/***********************************************************************************
 * Fetch the data
 **********************************************************************************/

// Iterates through the hash map of queries, gets the data, writes it to spreadsheet
function getMixpanelData() {

  for (var i in API_PARAMETERS)
  {
    cleanParameters(i)
    fetchMixpanelData(i);
  }
}

// Creates a menu in spreadsheet for easy user access to above function
function onOpen() {
  var activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  activeSpreadsheet.addMenu(
      "Mixpanel", [{
        name: "Get Mixpanel Data", functionName: "getMixpanelData"
      }]);
}

/**
 * Gets data from mixpanel api and inserts to spreadsheet
 *
 * Working with JSON https://developers.google.com/apps-script/external_apis?hl=en
 */
function fetchMixpanelData(sheetName) {

  var urlParams = getApiParameters(sheetName).join('&');

  // Add URL Encoding for special characters which might generate 'Invalid argument' errors.
  // Modulus should always be encoded first due to the % sign.
  urlParams = urlParams.replace(/\%/g, '%25');
  urlParams = urlParams.replace(/\s/g, '%20');
  urlParams = urlParams.replace(/\[/g, '%5B');
  urlParams = urlParams.replace(/\]/g, '%5D');
  urlParams = urlParams.replace(/\"/g, '%22');
  urlParams = urlParams.replace(/\(/g, '%28');
  urlParams = urlParams.replace(/\)/g, '%29');
  urlParams = urlParams.replace(/\>/g, '%3E');
  urlParams = urlParams.replace(/\</g, '%3C');
  urlParams = urlParams.replace(/\-/g, '%2D');
  urlParams = urlParams.replace(/\+/g, '%2B');
  urlParams = urlParams.replace(/\//g, '%2F');

  var url = "https://mixpanel.com/api/2.0/segmentation?" + urlParams;
  Logger.log("Request URL =  " + url);

//Basic Auth request using the API secret
  var options = {};
  options.headers = {"Authorization": "Basic " + Utilities.base64Encode(API_SECRET + ":")};
  var response = UrlFetchApp.fetch(url, options);

  var json = response.getContentText();
  var dataAll = JSON.parse(json);

  var dates = dataAll.data.series;
  var brands = Object.keys(dataAll.data.values);
  var parametersEntry = API_PARAMETERS[sheetName];

//Check if the query requests segmentation on property. Change table headings and format accordingly
  var data = [];
  if (urlParams.indexOf("on=prop") == -1) {
    data.push([ API_PARAMETERS[sheetName][3], API_PARAMETERS[sheetName][2]+" count" ]);
    for (i in dates) {
      data.push([ dates[i], dataAll.data.values[parametersEntry[0]][dates[i]] ]);
      }
    } else {
           data.push([ API_PARAMETERS[sheetName][3], API_PARAMETERS[sheetName][4], API_PARAMETERS[sheetName][2]+" count" ]);
           for (i in dates) {
                 for (j in brands) {
                   var x = dataAll.data.values[brands[j]][dates[i]];
                   if( x > 0){ data.push([ dates[i], brands[j],dataAll.data.values[brands[j]][dates[i]] ]) } //check for zero values and skip them
                 }
               }
             }

  insertSheet(sheetName, data);
}


/**
 * Creates a sheet and sets the name and index
 * insertSheet	https://developers.google.com/apps-script/reference/spreadsheet/spreadsheet#insertSheet(String,Integer)
 * feed it a two dimensional array of values
 * getRange(row, column, numRows, numColumns) https://developers.google.com/apps-script/reference/spreadsheet/sheet#getRange(Integer,Integer,Integer,Integer)
 * setValues(values) https://developers.google.com/apps-script/reference/spreadsheet/range#setValue(Object)
 */
function insertSheet(sheetName, values) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName) ||
    ss.insertSheet(sheetName, CREATE_NEW_SHEETS_AT);
    sheet.clear();

  for (var i = 0; i < values.length; ++i) {
    var data = [values[i]];
    var range = sheet.getRange((i + 1), 1, 1, data[0].length);
    range.setValues(data);
   }

// Sort final output table by last column
  var tableRange = sheet.getRange( 2, 1, values.length, data[0].length);
  tableRange.sort({column: data[0].length, ascending: false});

};


/***********************************************************************************
 * Mixpanel API Authentication
 *
 * Calculating the signature is done in parts:
 * sort the parameters you are including with the URL alphabetically,
 * join into a string resulting in key=valuekey2=value2,
 * concatenate the result with the api_secret by appending it,
 * and lastly md5 hash the final string.
 *
 * Data Export API Authentication Requirements doc
 * https://mixpanel.com/docs/api-documentation/data-export-api#auth-implementation
 *
 * Resources
 * Computing md5 http://productforums.google.com/forum/#!topic/apps-script/iFKH6s-0On8
 * https://developers.google.com/apps-script/reference/utilities/utilities?hl=en#computeDigest(DigestAlgorithm,String)
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/join
 **********************************************************************************/

/**
 * Returns an array of query parameters
 */
function getApiParameters(sheetName) {
  var parametersEntry = API_PARAMETERS[sheetName];
  return [
        'event=' + parametersEntry[0],
        'where=' + parametersEntry[1],
        'type=' + parametersEntry[2],
        'unit=' + parametersEntry[3],
        'on=' + parametersEntry[4],
        'from_date=' + FROM_DATE,
        'to_date=' + TO_DATE
    ];
}


/**
 *********************************************************************************
 * Date helpers
 *********************************************************************************
 */

// Returns today's date string in Mixpanel date format '2013-09-11'
function getMixpanelDateToday() {
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth() + 1;
  var yyyy = today.getFullYear();

  if (dd < 10) {
    dd = '0' + dd;
  }
  if ( mm < 10 ) {
    mm = '0' + mm;
  }

  today = yyyy + '-' + mm + '-' + dd;
  return today;
}

// Returns yesterday's's date string in Mixpanel date format '2013-09-11'
function getMixpanelDateDaysAgo(n){
  var today = new Date();
  var yesterday = new Date(today);
  yesterday.setDate(today.getDate() - n);

  //Logger.log(yesterday);
  var dd = yesterday.getDate();
  //Logger.log(yesterday);
  var mm = yesterday.getMonth() + 1;
  var yyyy = yesterday.getFullYear();

  if (dd < 10) {
    dd = '0' + dd;
  }
  if (mm < 10) {
    mm = '0' + mm;
  }

  yesterday = yyyy + '-' + mm + '-' + dd;
  //Logger.log(yesterday);
  return yesterday;
}


/**
 *********************************************************************************
 * Cleans parameter values by removing undefined
 *********************************************************************************
 */

function cleanParameters(sheetName){
  API_PARAMETERS[sheetName][1] =  API_PARAMETERS[sheetName][1]||'';
  API_PARAMETERS[sheetName][2] =  API_PARAMETERS[sheetName][2]||'general';
  API_PARAMETERS[sheetName][3] =  API_PARAMETERS[sheetName][3]||'day';
  API_PARAMETERS[sheetName][4] =  API_PARAMETERS[sheetName][4]||'';
}
