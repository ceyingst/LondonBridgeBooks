(function() {
  'use strict';

  let currentInstance = null;

  function IABookReader(url) {
    return new Promise(function(resolve) {
      if (!url) {
        return resolve(false);
      }
      // create iframe for ia book reader
      let html = '<div class="videoWrapper"><iframe src="' + url + '?ui=embed#page/n1/mode/2up" width="100%" height="600px"></iframe></div>';
      resolve(html);
    });
  }

  var APIS = {
    'www.archive.org': IABookReader,
    'archive.org': IABookReader
  };

  function loadFrame(link) {
    return Promise.resolve(link).then(function(link) {
      const url = new URL(link);
      // find proper api from api list
      const loader = APIS[url.hostname];
      return loader && loader(link);
    }).catch(console.warn);
  }

  function CustomVideoView(container) {
    if (!container) {
      return false;
    }
    const anchor = container.querySelector('a');
    if (!anchor || !/archive.org/i.test(anchor.href)) {
      return false;
    }

    const links = [anchor.href];
    // parse metadata
    /* *** removing metadata parsing function ***
    const rows = document.querySelectorAll('tr[class*=metadatarow]');
    Array.from(rows).forEach(function(row) {
      // find a description field
      if (row.firstChild.textContent === 'Description') {
        links = links.concat(row.lastChild.textContent.split(','));
      }
    });
    */
    // create container for iFrames
    const frameContainer = document.createElement('div');
    frameContainer.style.width = '100%';

    const mount = function() {
      const reqs = links.map(function(link) {
        return loadFrame(link);
      });

      Promise.all(reqs).then(function(reps) {
        // hide original viewer
        container.className += ' hide';
        // add each frames to one root
        reps.forEach(function(embeddedHTML) {
          embeddedHTML && (frameContainer.innerHTML += embeddedHTML);
        });
        // insert it
        container.parentNode.insertBefore(frameContainer, container);
      });

    };

    const unmount = function() {
      frameContainer.parentNode && frameContainer.parentNode.removeChild(frameContainer);
    };

    mount();

    return {unmount: unmount};

  }

  // set to true for global scripts or false for collection-constrained scripts
  let globalScope = true;

  // list all collection aliases that should trigger this script
  let collectionScope = [
    'p15700coll2'
  ];

  document.addEventListener('cdm-item-page:ready', function(e) {
    if (globalScope || collectionScope.includes(e.detail.collectionId)) {
      // unmount or remove current video player from DOM if it is exists
      currentInstance && currentInstance.unmount();
      // creates a new instance if it is url item and it is from vimeo.com
      currentInstance = CustomVideoView(document.querySelector('div[class*=itemUrl]'));
    }
  });

  document.addEventListener('cdm-item-page:update', function(e) {
    if (globalScope || collectionScope.includes(e.detail.collectionId)) {
      currentInstance && currentInstance.unmount();
      // updates an instance if it is url item and it is from vimeo.com
      currentInstance = CustomVideoView(document.querySelector('div[class*=itemUrl]'));
    }
  });

  document.addEventListener('cdm-item-page:leave', function(e) {
    if (globalScope || collectionScope.includes(e.detail.collectionId)) {
      // unmount or remove current video player from DOM if it is exists
      currentInstance && currentInstance.unmount();
    }
  });

})();

/* version history

1.3 - 2022 Feb 21 - remove metadata parsing function; add archive.org as URL option
1.2 - 2020 Jan 15 - reworked width to fit entire preview panel
1.1 - 2019 Aug - updated with global vs. collection toggle options
1.0 - 2018 June - initial implementation

*/
