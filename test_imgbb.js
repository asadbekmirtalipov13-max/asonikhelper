const fs = require('fs');
fetch('https://api.imgbb.com/1/upload?key=88c6cd2b32b499fd1e7272926e44bc3d', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: 'image=R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=' // 1x1 pixel base64
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));
