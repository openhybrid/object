/**
 * @preserve
 *
 *                                     .,,,;;,'''..
 *                                 .'','...     ..',,,.
 *                               .,,,,,,',,',;;:;,.  .,l,
 *                              .,',.     ...     ,;,   :l.
 *                             ':;.    .'.:do;;.    .c   ol;'.
 *      ';;'                   ;.;    ', .dkl';,    .c   :; .'.',::,,'''.
 *     ',,;;;,.                ; .,'     .'''.    .'.   .d;''.''''.
 *    .oxddl;::,,.             ',  .'''.   .... .'.   ,:;..
 *     .'cOX0OOkdoc.            .,'.   .. .....     'lc.
 *    .:;,,::co0XOko'              ....''..'.'''''''.
 *    .dxk0KKdc:cdOXKl............. .. ..,c....
 *     .',lxOOxl:'':xkl,',......'....    ,'.
 *          .';:oo:...                        .
 *               .cd,    ╔═╗┌─┐┬─┐┬  ┬┌─┐┬─┐   .
 *                 .l;   ╚═╗├┤ ├┬┘└┐┌┘├┤ ├┬┘   '
 *                   'l. ╚═╝└─┘┴└─ └┘ └─┘┴└─  '.
 *                    .o.                   ...
 *                     .''''','.;:''.........
 *                          .'  .l
 *                         .:.   l'
 *                        .:.    .l.
 *                       .x:      :k;,.
 *                       cxlc;    cdc,,;;.
 *                      'l :..   .c  ,
 *                      o.
 *                     .,
 *
 *             ╦ ╦┬ ┬┌┐ ┬─┐┬┌┬┐  ╔═╗┌┐  ┬┌─┐┌─┐┌┬┐┌─┐
 *             ╠═╣└┬┘├┴┐├┬┘│ ││  ║ ║├┴┐ │├┤ │   │ └─┐
 *             ╩ ╩ ┴ └─┘┴└─┴─┴┘  ╚═╝└─┘└┘└─┘└─┘ ┴ └─┘
 *
 * Created by Valentin on 10/22/14.
 *
 * Copyright (c) 2015 Valentin Heun
 *
 * All ascii characters above must be included in any redistribution.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

var fs = require('fs');
var path = require('path');
var cheerio = require('cheerio');
var templates = [];

exports.loadAllModules = function(allModules, callback) {
  var templatePath = '/../libraries/templates/';
  var index = 0;
  var that = this;

  var loadOneTemplate = function (index) {

      var name = allModules[index];
      console.log('Loading template: ' + name);
      var filePath = path.join(__dirname, templatePath + name + ".html");
      fs.readFile(filePath, {encoding: 'utf-8'}, function(err,data){

    if (!err){
     // TODO : Injex variables
      templates[name] = data;
      console.log(name + " loaded !");
      index++;
      if (index < allModules.length) {
            loadOneTemplate(index);
        } else {
          callback();
        }

    } else {
      console.log(err);
    }
  });

  }
    loadOneTemplate(0);

}

exports.injectTemplate = function() {
  return null;
}

exports.getTemplates = function(){
  return templates;
}

exports.loadTemplate =  function(templateName, data)
{

    var htmlTemplate = templates[templateName]

    if(typeof data !== 'undefined') {
      for(var i=0;i<data.length;i++){
        var obj = data[i];
        //extract each value and attribute the 
        for(var key in obj)
        {
          var attrName = key;
          var attrValue = obj[key];
     
          if(typeof attrValue === 'string')  // if it's a single element (update the home page etc)
          {
            var reg = new RegExp('\{\{\\s*'+attrName+'\\s*\}\}', 'g');
           // htmlTemplate = reg.exec(htmlTemplate, attrValue);
            htmlTemplate = htmlTemplate.replace(reg, attrValue);
          }
        }
      }
    }

   return htmlTemplate;
}

exports.updateTemplate = function(objectId, parentNode, data, realTimeUpdate)
{
  var $ = cheerio.load(parentNode);
  //get the element to update
  var elementToUpdate  = $;

  if(realTimeUpdate) { 
//TODO : not sure to do that
   elementToUpdate = $('[data-id="'+objectId+'"]');
  } 

  for(var i=0;i<data.length;i++){
    var obj = data[i];

    //extract each value and attribute the 
    for(var key in obj)
    {
      var attrName = key;
      var attrValue = obj[key];
 
      if(typeof attrValue === 'string')  // if it's a single element (update the home page etc)
      {
        elementToUpdate('[data-'+attrName+']').text(attrValue);

      }
      else
      {
           //for each item, we delete the tbody content, and replace with new columns  
          var subObject = $('[data-'+attrName+']');


          subObject.html("");

          for(var key in attrValue){

            //create the new html content from string
            var subAttrName = key;
            var newHtml = "<tr>";
            var subAttrValue = attrValue[key];

            if(typeof subAttrValue === 'object') // if it's containing an array
            {
                 for(var item in subAttrValue){
                  var itemName = item;
                  var itemValue = subAttrValue[item];

                  newHtml += "<td>"+itemValue+"</td>";
                }
                newHtml += "</tr>";
                subObject.append(newHtml); // append the content
            }
        }
      } // end if != string
    } // end key extraction
  }
  return elementToUpdate.html();
}