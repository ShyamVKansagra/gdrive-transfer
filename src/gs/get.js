/**
 * Returns array folderArray containing the top folder and all descendent folders
 * Each element of folderArray is a two-element array
 * The first element is {string} a folder ID, the second element is {string} the folder's path name.
 * 
 * To accommodate Google Apps Script runtime quotas (max = 6 mins),
 * this script will return an array of continuationTokens for folders that 
 * still need to be saved.  Due to a bug in Google Apps Script continuation tokens (https://code.google.com/p/google-apps-script-issues/issues/detail?id=4116)
 * this script will traverse the folder structure level by level.  That is,
 * it will save all siblings before it moves on to any child folders for any given iterator.
 * 
 *
 * @param {string} folderId identification string for top folder
 * @param {array} folderArray array whose elements are also arrays, 
 *    each one containing two elements: {string} a folder ID and {string} the folder path name
 * @param {string} newOwner email address identifying new owner of folder
 * @param {array} continuationTokens array of {string} continuation tokens to resume unfinished iterators
 *    
 */
function getFolders(folderId, folderArray, newOwner, continuationTokens) {
    
    var children,           // {FolderIterator}
        nextChild,          // {Folder}
        grandChildren,      // {FolderIterator}
        pair,               // {array}
        currTime,           // {number}
        timeIsUp = false;   // {boolean}
    
    // Google Apps Scripts have a maximum execution time of 6 minutes
    var MAX_RUNNING_TIME = 5.7 * 60 * 1000;   // 5.7 minutes in milliseconds
    var startTime = (new Date()).getTime();
    
    
    
    // if no tokens exist, get iterator from @param folderId
    if (continuationTokens.length === 0) {
        
        // adding the editor first makes sure that 
        // all the transferred folders are added to the right parent folder
        children = DriveApp.getFolderById(folderId).addEditor(newOwner).getFolders();
                
    } else {
        
        children = DriveApp.continueFolderIterator( continuationTokens.pop() );
        
    }
    
    
    
    while ( children.hasNext() && !timeIsUp ) {
        
        // set variables for current iteration
        nextChild = children.next();
        grandChildren = nextChild.getFolders();
        currTime = (new Date()).getTime();
        timeIsUp = (currTime - startTime >= MAX_RUNNING_TIME);
        
        
        
        // create pair of (Id, path), then push the pair to folderArray
        pair = [ nextChild.getId(), nextChild.getName() ];
        folderArray.push(pair);
        
        
        
        
        // if child has children, save continuation token and begin iterating through children
        if ( grandChildren.hasNext() ) {
            
            continuationTokens.push( grandChildren.getContinuationToken() );
            
        } 
        
        // if no folders remain in iterator and continuationTokens exist, children = next iterator
        if ( !children.hasNext() && continuationTokens.length > 0) {
            
            children = DriveApp.continueFolderIterator( continuationTokens.shift() );
                        
        }
        
    }
    
    
    
    if ( timeIsUp ) {
        
        continuationTokens.push( children.getContinuationToken() );
        
    }
    
    
    
    return [ folderArray, continuationTokens ];
    
}






/**
 * Returns OAuth token for use with Google Picker
 */
function getOAuthToken() {
    return ScriptApp.getOAuthToken();
}