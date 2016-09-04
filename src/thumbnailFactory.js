'use strict';

var ImageResource = require('./ImageResource');
var imageFormatError = "Unsupported image format for LegacyTileSource.";

var _getResourceFormat = function(mimeType) {
  switch(mimeType) {
  case('image/jpeg'):
    return 'jpg';
  case('image/png'):
    return 'png';
  case('image/gif'):
    return 'gif';
  default:
    throw(imageFormatError);
  }
};

var _getThumbUrl = function(resource, width) {

  var _buildResourceSize = function() {
    return "/full/" + width + ",/";
  };

  var id = resource['@id'];
  if(!id.toLowerCase().match(/^.*\.(png|jpg|jpeg|gif)$/)) { // it is still a service URL
    var format = _getResourceFormat(resource.format);
    return resource.service['@id'] + _buildResourceSize() + '0/default.' + format;
  }
  else { // we still don't want the full size
    return id.replace("/full/full/", _buildResourceSize());
  }
};

var _getThumbLevel = function(resource, width, height) {
  var widthParam = 200,
      scaleFactor = widthParam/width,
      scaledWidth = width*scaleFactor,
      scaledHeight = height*scaleFactor;

  if(resource.default) {
    // resources with a default field are not actually
    // images, but contain more images. Recurse to retrieve.
    return _getThumbLevel(resource.default, scaledWidth, scaledHeight);
  }

  return {
    url: _getThumbUrl(resource, scaledWidth),
    height: height,
    width: width
  };
};

var _makeThumbnailConfig = function(resource, parent) {
  var bounds = parent.getBounds();

  return {
    tileSource: {
      type: 'legacy-image-pyramid',
      levels: [
        _getThumbLevel(resource, bounds.width, bounds.height),
      ]
    },
    parent: parent,
    imageType: 'thumbnail',
    dynamic: false,
    zIndex: 9999
  };
};

var ThumbnailFactory = function(canvas, parent) {
  // The canvas has a thumbnail object.
  if(canvas.thumbnail && canvas.thumbnail.service) {
    return new ImageResource(_makeThumbnailConfig(canvas.thumbnail, parent));
  }

  // If the canvas has no thumbnail object, we try to fall back to using an image from it.
  // If the canvas has no images and no thumbnail, we can't do anything, so we don't bother.
  if(canvas.images) {
    try {
      var config = _makeThumbnailConfig(canvas.images[0].resource, parent);

      if(config.tileSource.type !== 'legacy-image-pyramid') {
        console.log(canvas.images);
        console.log(config.tileSource);
      }
      return new ImageResource(config);
    } catch (error){
      // If we can't use LegacyTileSource to build the thumbnail, don't build a thumbnail.
      if(error == imageFormatError) {
        return;
      } else {
        throw (error);
      }
    }
  }
};

module.exports = ThumbnailFactory;
