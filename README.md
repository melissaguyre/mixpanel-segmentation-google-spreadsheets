mixpanel-segmentation-google-spreadsheets
=========================================

Mixpanel Segmentation Data Export for report automation into Google Spreadsheets using Google Apps Script



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
*/
var API_KEY = '';
var API_SECRET = '';

/**
* Step 2) Define the tab # at which to create new sheets in the spreadsheet.
* 0 creates a new sheet as the first sheet.
* 1 creates a new sheet at the second sheet and so forth.
*/
var CREATE_NEW_SHEETS_AT = 1;

/**
* Step 3) Define date range as a string in format of 'yyyy-mm-dd' or '2013-09-13'
*
* Today's Date: set equal to getMixpanelDateToday()
* Yesterday's Date: set equal to getMixpanelDateYesterday()
*/
var FROM_DATE = '2013-09-13';
var TO_DATE = getMixpanelDateYesterday();

/**
* Step 4) Define Segmentation Queries - Get data for an event, segmented and filtered by properties.
*
* Format is: 'Sheet Name' : [ 'event', 'where', 'type', 'unit' ],
* For example: 'Unique Yums' : [ 'Yum Button', '(properties["Platform"])=="iPhone App" and (properties["mp_country_code"])=="GB"', 'unique', 'day' ],
*
* For full details on Segmentation Queries https://mixpanel.com/docs/api-documentation/data-export-api#segmentation-default
* Sheet Name - What you want the sheet with your data to be called.
* event - The event that you wish to segment on.
* where - The property expression to segment the event on.
* type - This can be 'general', 'unique', or 'average'.
* unit - This can be 'minute', 'hour', 'day', or 'month'.
*/
var API_PARAMETERS = {
    'Sheet 1' : [ 'event', 'where', 'type', 'day' ],
    'Sheet 2' : [ 'event', 'where', 'type', 'day' ],
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
