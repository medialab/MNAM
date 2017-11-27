
export function map(value, start1, stop1, start2, stop2) {
  return parseFloat(start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1)));
}

export function lerp(start, end, alpha) {
  return start + (end - start) * alpha
}

export function cleanupLabel(s, length) {
  if (!s) return s
  if (s.length > length) {
    return s.slice(0, length - 3) + '...'
  } else {
    return s
  }
}

export function shuffleArray(a) {
  for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
  }
}

Array.prototype.move = function (old_index, new_index) {
  if (new_index >= this.length) {
      var k = new_index - this.length
      while ((k--) + 1) {
          this.push(undefined)
      }
  }
  this.splice(new_index, 0, this.splice(old_index, 1)[0])
  return this
}

export function dataURItoBlob (dataURI) {
  // convert base64/URLEncoded data component to raw binary data held in a string
  var byteString;

  if (dataURI.split(',')[0].indexOf('base64') >= 0)
    byteString = atob(dataURI.split(',')[1]);
  else
    byteString = unescape(dataURI.split(',')[1]);

  // separate out the mime component
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

  // write the bytes of the string to a typed array
  var ia = new Uint8Array(byteString.length);

  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ia], {
    type: mimeString
  });
}

export function dateToString (d) {
  return `${d.getYear()+1900}-${d.getMonth()+1}-${d.getDate()}_${d.getHours()}-${d.getMinutes()}-${d.getSeconds()}`
}