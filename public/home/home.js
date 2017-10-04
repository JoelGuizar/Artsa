// const URL = 'http://ec2-52-89-83-246.us-west-2.compute.amazonaws.com:3000';
const URL = 'http://localhost:3000';
let globalUserNum = 0;

// if (process.env.NODE_ENV === 'test') {
//   writeLocation = `${__dirname}/../test/db.test.json`;
//   //gamesList = require(writeLocation);
// }
function sendObj(user, notes) {
  var obj = {
    user: user,
    notes: notes
  }
  return JSON.stringify(obj);
}

function createUser(userNumber) {
  $.ajax({
    url: URL + '/create',
    type: "POST",
    data: sendObj('user' + userNumber.toString(), ''),
    dataType: "json",
    contentType: "application/json"
  });
}

function getUserNumber() {
  $.get(URL + '/notes/tracker', function (data) {
    globalUserNum = parseInt(data.notes);
  });

}

$(document).ready(function () {
  const roomsContainer = $('#rooms');

  // // Go to room
  // roomsContainer.on('click', 'a', function (event) {
  //   let user = event.target.innerHTML.slice(9, 10);
  //   user = parseInt(user) + 1;

  //   // // create or update tracker to keep track of numbers of users
  //   // $.ajax({
  //   //   url: URL + '/notes/tracker',
  //   //   type: "PUT",
  //   //   data: sendObj('tracker', user),
  //   //   dataType: "json",
  //   //   contentType: "application/json"
  //   // });

  //   if (user === 1) $('#room1').text('Room 1:  ' + user.toString() + ' User');
  //   if (user > 1) $('#room1').text('Room 1:  ' + user.toString() + ' Users');
  //   let roomUrl = URL + "/rooms/room1" + 'user' + user.toString();
  //   createUser(user);

  //   window.open(roomUrl);
  // });

  const roomDivs = [];
  const roomNameInput = $('input#room-name');
  const passwordArr = [];
  const roomPasswordInput = $('input#optionalPassword')
  //

  //

  //const roomPassword = roomPasswordInput.val().trim();

  createRoomsSocket();
  function createRoomsSocket() {

    // Rooms socket namespace
    const roomsSocket = io('/rooms');

    // Adds rooms previously before going to home page
    function addExistingRooms(rooms) {
      rooms.forEach(room => {
        const roomDiv = createRoomDiv(room.name, room.password, room.clients.length);
        roomDivs.push(roomDiv);
        roomsContainer.append(roomDiv);
      });
    }
    roomsSocket.on('connect', () => {
      roomsSocket.emit('addExisting', addExistingRooms);
    });

    // append room div to UI
    function appendRoomDiv(roomName, roomPassword) {
      const newRoomDiv = createRoomDiv(roomName, roomPassword);
      roomDivs.push(newRoomDiv);
      roomsContainer.append(newRoomDiv);
    }

    // Add new room to room list
    $('form#create-room').submit((event, elem) => {
      event.preventDefault();
      const roomNameVal = roomNameInput.val().trim();
      const roomPassword = roomPasswordInput.val().trim();

      // clear input boxes
      roomNameInput.val('');
      roomPasswordInput.val('');

      // don't submit if empty
      if (!roomNameVal) return false;
      roomsSocket.emit('createRoom', roomNameVal, roomPassword, appendRoomDiv);
    });

    // add room divs on valid name submit
    roomsSocket.on('addRoomDiv', appendRoomDiv);

    function updateUserCount(roomName, numUsers) {
      // get roomName span tag w/ roomName inside
      const roomNameTag = $(`span.roomName:contains(${roomName})`);

      // get sibling of roomNameTag to get numUsersTag and tag w/ grammar-sensitive "user"
      const numUsersTag = roomNameTag.siblings('span.numUsers');
      const userStrTag = roomNameTag.siblings('span.userStr');

      // change num w/in numUsersTag
      numUsersTag.text(numUsers);

      // adjust "users" if only 1 user in room
      userStrTag.text(singleOrPluralUsers(numUsers));
    };

    roomsSocket.on('updateUserCount', updateUserCount);
  }

  function createRoomDiv(roomName, roomPassword, numUsers = 0) {
    var newLinkDiv;
    if (roomPassword) {
      newLinkDiv = $(
        `<div class='link-div well'>
          <p class="roomInfo"></p>
            <form>
              <input class='needPassword' type='password' placeholder='Password Required'>
              <button type='submit' class='submitPassword'>Submit</input>
            </form > 
        </div>`
      );

      // adding submit handler to password form
      newLinkDiv.find('form').submit(event, form => {
        // prevent refreshing
        event.preventDefault();

        // check if typed password equal to room's password
        const typedPassword = newLinkDiv.find('input.needPassword').val();
        if (typedPassword === roomPassword) {
          window.location.replace('/rooms/' + roomName);
        }
      });

    } else {

      newLinkDiv = $(
        `<div class='link-div well'>
          <a class="roomInfo" href="./rooms/${roomName}"></a>
        </div>`
      );
    }

    // writes "user" if num of users is 1
    // o.w. "users"
    // because grammar
    newLinkDiv.find('.roomInfo').append(
      `<span class='roomName'>${roomName}</span>: 
      <span class='numUsers'>${numUsers}</span> 
      <span class='userStr'>${singleOrPluralUsers(numUsers)}</span>`
    );

    return newLinkDiv;
  }

  function singleOrPluralUsers(numUsers) {
    return (numUsers === 1) ? 'user' : 'users';
  }

});
