/**
 * Script Name: VPOST Data Processing Script
 * Purpose: This script is used to automatically process the data collected by the 
 *          VPOST Data Collection Form. This script will do most of the work for you,
 *          and any required user inputs will be specified. This script's output
 *          must be MANUALLY copy and pasted to the Master Site Spreadsheet.
 *          This script was developed for use by the Virginia Partnership for
 *          Out-of-School Time (VPOST).
 * 
 * Features:
 * -  Copy and format data row by row into a second sheet.
 * -  Combine address, city, state, and ZIP code into a full address.
 * -  Find longitude and latitude from full address.
 * -  Process the funding data for use in ArcGIS Online.
 * -  Output the finalized data into a second sheet.
 * 
 * Instructions:
 * 1) This script will not function if any spreadsheet or the google form is
 *    reformatted, please do not modify anything unless you are capable of 
 *    updating the code as well.
 * 2) IMPORTANT! This script assumes that any 'other' funding sources are prefixed
 *    with <Other:>, such as "Other: Individual Funding." Please verify the 
 *    inputted sheet follows this naming convention.
 * 3) IMPORTANT! This script assumes that there is a header comprised of 1 row
 *    for both sheets. Please ensure that this is the case before running.
 * 4) Delete everything except for the header for both the "Unmodified Responses"
 *    and "Modified Responses" sheets.
 * 5) Copy & paste the responses you want to process into the "Unmodified Responses"
 *    sheet.
 * 6) Run the script by going to the form responses spreadsheet, click on
 *    'Extensions', click on 'Apps Script', copy & paste this code if missing/updated,
 *    then click on 'Run' to run the script.
 *    
 * Author: Jayden Chan (jaydenc@usc.edu, jaydenchan26@gmail.com)
 * Date: 07-24-27
 */

function processData() {
  // Defines which sheets to use. Indexing starts at 0.
  const oldSheetIndex = 1; // Uses 2nd sheet
  const newSheetIndex = 2; // Uses 3rd sheet

  // Maps the old sheet columns to the new sheet columns. Indexing starts at 1.
  const columnMappings = {
    1: 1,   // County
    2: 2,   // Business Name
    3: 4,   // Address
    4: 5,   // City
    5: 6,   // State
    6: 9,   // ZIP Code
    7: 3,   // Phone Number
    9: 11,  // License Type
    10: 12, // License Capacity
  };

  // Contains indexes of to-modify old sheet columns
  const oldColumns = {
    funding: 8,
  };

  // Contains indexes of modified new sheet columns
  const newColumns = {
    longitude: 8,
    latitude: 7,
    fullAddress: 10,
    cclc: 13,
    childcareSubsidy: 14,
    municipal: 15,
    foundations: 16,
    tuition: 17,
    wioa: 18,
    cacfp: 19,
    other: 20
  };

  // Maps specific funding sources to columns in the new sheet
  const fundingMap = {
    'Childcare Subsidy/CCDBG': newColumns.childcareSubsidy,
    'Local Municipal Funding': newColumns.municipal,
    'Private Foundations': newColumns.foundations,
    'Tuition/Fees': newColumns.tuition,
    'WIOA': newColumns.wioa,
    'CACFP': newColumns.cacfp
  };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const oldSheet = ss.getSheets()[oldSheetIndex];
  const newSheet = ss.getSheets()[newSheetIndex];

  const oldData = oldSheet.getDataRange().getValues();
  const newData = [];

  for (let i = 1; i < oldData.length; i++) {
    const oldRow = oldData[i]
    const newRow = Array(20).fill(''); // Assumes new sheet has 20 columns

    for (const [oldCol, newCol] of Object.entries(columnMappings)) {
      newRow[newCol - 1] = oldRow[oldCol - 1];
    }
  
    // ===== Combines address, city, state and ZIP =====
    const combinedAddress = `${oldRow[2]}, ${oldRow[3]}, ${oldRow[4]} ${oldRow[5]}`;
    newRow[newColumns.fullAddress - 1] = combinedAddress;

    // ===== Get coordinates =====
    const { longitude, latitude } = getLatLong(combinedAddress); // Uses function defined below
    newRow[newColumns.longitude - 1] = longitude;
    newRow[newColumns.latitude - 1] = latitude;

    // ===== Process funding data =====
    const fundingString = oldRow[oldColumns.funding - 1];
    const fundingList = fundingString.split(',').map(f => f.trim());

    if (fundingList.includes('21st CCLC Grant - Traditional Funding') || fundingList.includes('21st CCLC Grant - CBO Funding')) {
      newRow[newColumns.cclc - 1] = 'Y';
    }

    for (const [source, columnIndex] of Object.entries(fundingMap)) {
      if (fundingList.includes(source)) {
        newRow[columnIndex - 1] = 'Y';
      }
    }

    if (fundingList.some(f => f.startsWith('Other:'))) {
      newRow[newColumns.other - 1] = 'Y';
    }

    newData.push(newRow);
  }

  newSheet.getRange(2, 1, newData.length, newData[0].length).setValues(newData);

  Logger.log("Script ran successfully.");
}

function getLatLong(combinedAddress) {
  const api_key = 'API_KEY' // !! Keep this info private !!
  const api_url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(combinedAddress)}&key=${api_key}`;
  const response = UrlFetchApp.fetch(api_url);
  const data = JSON.parse(response.getContentText());

  if (data.results && data.results.length > 0) {
    const location = data.results[0].geometry.location;
    return {
      longitude: location.lng,
      latitude: location.lat
    };
  }
  return {
    longitude: 0,
    latitude: 0
  };
}