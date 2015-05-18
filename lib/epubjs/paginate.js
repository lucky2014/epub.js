EPUBJS.Paginate = function(book, options) {

  EPUBJS.Continuous.apply(this, arguments);

  this.settings = EPUBJS.core.extend(this.settings || {}, {
    width: 600,
    height: 400,
    axis: "horizontal",
    forceSingle: false,
    minSpreadWidth: 800, //-- overridden by spread: none (never) / both (always)
    gap: "auto", //-- "auto" or int
    layoutOveride : null, // Default: { spread: 'reflowable', layout: 'auto', orientation: 'auto'},
    overflow: "hidden",
    infinite: false
  });

  EPUBJS.core.extend(this.settings, options);

  this.isForcedSingle = false;
  
  this.start();
};

EPUBJS.Paginate.prototype = Object.create(EPUBJS.Continuous.prototype);
EPUBJS.Paginate.prototype.constructor = EPUBJS.Paginate;


EPUBJS.Paginate.prototype.determineSpreads = function(cutoff){
  if(this.isForcedSingle || !cutoff || this.width < cutoff) {
    return false; //-- Single Page
  }else{
    return true; //-- Double Page
  }
};

EPUBJS.Paginate.prototype.forceSingle = function(bool){
  if(bool) {
    this.isForcedSingle = true;
    // this.spreads = false;
  } else {
    this.isForcedSingle = false;
    // this.spreads = this.determineSpreads(this.minSpreadWidth);
  }
};

/**
* Uses the settings to determine which Layout Method is needed
* Triggers events based on the method choosen
* Takes: Layout settings object
* Returns: String of appropriate for EPUBJS.Layout function
*/
EPUBJS.Paginate.prototype.determineLayout = function(settings){
  // Default is layout: reflowable & spread: auto
  var spreads = this.determineSpreads(this.settings.minSpreadWidth);
  var layoutMethod = spreads ? "ReflowableSpreads" : "Reflowable";
  var scroll = false;

  if(settings.layout === "pre-paginated") {
    layoutMethod = "Fixed";
    scroll = true;
    spreads = false;
  }

  if(settings.layout === "reflowable" && settings.spread === "none") {
    layoutMethod = "Reflowable";
    scroll = false;
    spreads = false;
  }

  if(settings.layout === "reflowable" && settings.spread === "both") {
    layoutMethod = "ReflowableSpreads";
    scroll = false;
    spreads = true;
  }

  this.spreads = spreads;
  // this.render.scroll(scroll);

  return layoutMethod;
};

/**
* Reconciles the current chapters layout properies with
* the global layout properities.
* Takes: global layout settings object, chapter properties string
* Returns: Object with layout properties
*/
EPUBJS.Paginate.prototype.reconcileLayoutSettings = function(global, chapter){
  var settings = {};

  //-- Get the global defaults
  for (var attr in global) {
    if (global.hasOwnProperty(attr)){
      settings[attr] = global[attr];
    }
  }
  //-- Get the chapter's display type
  chapter.forEach(function(prop){
    var rendition = prop.replace("rendition:", '');
    var split = rendition.indexOf("-");
    var property, value;

    if(split != -1){
      property = rendition.slice(0, split);
      value = rendition.slice(split+1);

      settings[property] = value;
    }
  });
 return settings;
};

EPUBJS.Paginate.prototype.start = function(){
  // On display
  // this.layoutSettings = this.reconcileLayoutSettings(globalLayout, chapter.properties);
  // this.layoutMethod = this.determineLayout(this.layoutSettings);
  // this.layout = new EPUBJS.Layout[this.layoutMethod]();
  this.hooks.display.register(this.registerLayoutMethod.bind(this));
  
  this.currentPage = 0;

};

EPUBJS.Paginate.prototype.registerLayoutMethod = function(view) {
  var task = new RSVP.defer();

  this.layoutMethod = this.determineLayout({});
  this.layout = new EPUBJS.Layout[this.layoutMethod](view);
  this.formated = this.layout.format(this.settings.width, this.settings.height, this.settings.gap);

  // Add extra padding for the gap between this and the next view
  view.iframe.style.marginRight = this.layout.gap+"px";

  // Set the look ahead offset for what is visible
  this.settings.offset = this.formated.pageWidth;

  task.resolve();
  return task.promise;
};

EPUBJS.Paginate.prototype.page = function(pg){
  
  // this.currentPage = pg;
  // this.renderer.infinite.scrollTo(this.currentPage * this.formated.pageWidth, 0);
  //-- Return false if page is greater than the total
  // return false;
};

EPUBJS.Paginate.prototype.next = function(){

  this.q.enqueue(function(){
    this.scrollBy(this.formated.pageWidth, 0);
    return this.check();
  });

  // return this.page(this.currentPage + 1);
};

EPUBJS.Paginate.prototype.prev = function(){

  this.q.enqueue(function(){
    this.scrollBy(-this.formated.pageWidth, 0);
    return this.check();
  });
  // return this.page(this.currentPage - 1);
};

// EPUBJS.Paginate.prototype.display = function(what){
//   return this.display(what);
// };