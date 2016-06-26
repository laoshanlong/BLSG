chrome.downloads.onDeterminingFilename.addListener(function(downloadItem, suggest){
  console.log("original: "+downloadItem.filename);

  suggest({filename: "adding/"+downloadItem.filename});
});
