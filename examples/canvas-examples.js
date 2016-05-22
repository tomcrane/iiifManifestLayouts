var App = {
  // ----------
  init: function() {
    var self = this;
 
    this.$images = $('#images-list');
    this.openManifest('http://tomcrane.github.io/scratch/manifests/john-dee.json');

    $(window).on('resize', function() {
      if (self.viewer) {
        self.viewer.resize();
      }
    });
  },

  // ----------
  openManifest: function(manifestUrl) {
    var self = this;

    this.$images.empty();
    
    
      var _setImagesForCanvas = function(canvas) {
        self.selectedCanvas = canvas;
        self.$images.empty();

        self.selectedCanvas.images.forEach(function(image) {
          var text = image.label;
          if(image.imageType === 'main') {
            text += " (default)";
          }
          if(image.imageType === 'detail') {
            text +=" (detail)";
          }
          if(image.imageType !== 'thumbnail') {
            var listItem = $('<li>');
            var label = $('<label>').text(text);

            var checkbox = $('<input type=checkbox>');
            checkbox.prop('id', image.id);
            checkbox.prop('checked', image.visible);

            checkbox.change(image, function(event) {
              if(event.target.checked) {
                if(image.status === 'shown') {
                  image.show();
                } else {
                  self.selectedCanvas.removeThumbnail();
                  image.openTileSource();
                }
              } else {
                image.hide();
              }
            });
            label.append(checkbox);
            listItem.append(label);
            listItem.prependTo(self.$images);
          }
        });
      };
      
      

    $.get(manifestUrl, function(manifest) {

      if (self.viewer) {
        self.viewer.destroy();
      }

      self.viewer = manifestor({
        manifest: manifest,
        container: $('#example-container'),
        perspective:  'overview',
        canvasClass: 'canvas', //default set to 'canvas'
        frameClass: 'frame', //default set to 'frame'
        labelClass: 'label', //default set to 'label'
        viewportPadding: {  // in detail view, make sure this area is clear
          top: 0,
          left: 10,
          right: 10,
          bottom: 10 // units in % of pixel height of viewport
        },
        // selectedCanvas: manifest.sequences[0].canvases[50]['@id']
      });

      self.viewer.selectViewingMode('individuals');
      self.viewer.selectPerspective('detail');
      
      var selectedCanvas = self.viewer.getSelectedCanvas();
      _setImagesForCanvas(selectedCanvas);

      // Debug/example code: Listen for tile source requests and loads
      self.viewer.on('detail-tile-source-requested', function(e) {
        // console.log('detail tile source requested', e.detail);
      });
      self.viewer.on('viewer-state-updated', function() {
        console.log('I have updated!');
      });

      self.$images.sortable({
        stop: function(event, ui) {
          var inputs = event.target.querySelectorAll('input');
          var i = 0;
          for(i; i < inputs.length; i++) {

            // zIndex is backwards from this UI; 0 is on the bottom for zIndex, but 0 is the top
            // of this sortable UI element array.
            var image = self.selectedCanvas.getImageById(inputs[i].id);
            self.selectedCanvas.moveToIndex(image, inputs.length - (i + 1));
          }
        }
      });

      var _setCheckbox = function(id, value) {
        var checkbox = $('#' + id);
        checkbox.prop('checked', value);
      };

      self.viewer.on('image-hide', function(e) {
        _setCheckbox(e.detail, false);
      });

      self.viewer.on('image-show', function(e) {
        _setCheckbox(e.detail, true);
      });

      self.viewer.on('image-resource-tile-source-opened', function(e) {
        _setCheckbox(e.detail.id, e.detail.visible);
      });

    });
  },

};

// ----------
App.init();
