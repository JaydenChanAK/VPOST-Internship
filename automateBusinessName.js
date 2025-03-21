function automateBusinessName() {
    // Change these variables
    var sourceSpreadsheetID = '<YOUR SOURCE ID HERE>';
    var sourceSheetName = 'Master List';
    var destinationSpreadsheetID = '<YOUR DESTINATION ID HERE>';
    var destinationSheetName = 'Sheet1';

    // Open spreadsheets and sheets
    var sourceSpreadsheet = SpreadsheetApp.openById(sourceSpreadsheetID);
    var sourceSheet = sourceSpreadsheet.getSheetByName(sourceSheetName);

    var destinationSpreadsheet = SpreadsheetApp.openById(destinationSpreadsheetID);
    var destinationSheet = destinationSpreadsheet.getSheetByName(destinationSheetName);

    // Change these variables
    var startRow = 3; // Start from row 3
    var startCol = 2; // Start from column 2
    var numCols = 2; // Number of columns to read
    var numRows = sourceSheet.getLastRow() - startRow + 1;

    var destinationStartRow = 2; // Copy to row 2
    var destinationStartColumn = 2; // Copy to column 2

    // Read data
    var dataRange = sourceSheet.getRange(startRow, startCol, numRows, numCols);
    var data = dataRange.getValues();

    // Clear destination sheet
    destinationSheet.getRange(destinationStartRow, destinationStartColumn, destinationSheet.getMaxRows() - destinationStartRow + 1, 1).clearContent();

     // Copying
    for (var i = 0; i < data.length; i++) {
        var programName = data[i][0];
        var siteName = data[i][1];
        var combinedData = programName + ' at ' + siteName;

        // Write the combined data to the destination sheet
        destinationSheet.getRange(destinationStartRow + i, destinationStartColumn).setValue(combinedData);
    }
}