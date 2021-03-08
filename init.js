'use strict';

const availableNodes = [
  { x: 0, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: 2 },
  { x: 0, y: 3 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 1, y: 2 },
  { x: 1, y: 3 },
  { x: 2, y: 0 },
  { x: 2, y: 1 },
  { x: 2, y: 2 },
  { x: 2, y: 3 },
  { x: 3, y: 0 },
  { x: 3, y: 1 },
  { x: 3, y: 2 },
  { x: 3, y: 3 },
];

let initialized = false;
let headNode = {};
let tailNode = {};
let NodeVistied = [];
let startNodePosition = {};
let isFirstClick = true;
let firstClickedNode = {};
let player = 'Player 1';
let lines = [];
const node = document.getElementById('app');

// Update the second argument to `Elm.Main.embed` with your selected API. See
// the Intro section of the technical assessment documentation for more
// information:
// https://technical-assessment.konicaminoltamarketplace.com
const app = Elm.Main.embed(node, {
  api: 'Client',
  hostname: '',
});

app.ports.startTimer.subscribe((int) => {
  setTimeout(() => {
    app.ports.timeout.send(int);
  }, 10000);
});

app.ports.request.subscribe((message) => {
  //Take the message and turn the string into JSON
  message = JSON.parse(message);
  let responseObj;

  if (!initialized) {
    responseObj = initilize(message);
    initialized = true;
  } else {
    //Get the JSON response from the function based on the incoming json object
    responseObj = handleIncomingMessage(message);
  }

  app.ports.response.send(responseObj);

  // Parse the message to determine a response, then respond:
});

//To do fix this function
function initilize(incomingMsg) {
  console.log(incomingMsg);
  if (incomingMsg.msg === 'INITIALIZE') {
    const outgoingMsg = {
      msg: 'INITIALIZE',
      body: {
        newLine: null,
        heading: player,
        message: "Awaiting Player 1's Move",
      },
    };
    console.log(outgoingMsg);
    return outgoingMsg;
  }
}

function isOctoLinearMove(move) {
  let start = firstClickedNode;
  let end = move;
  //Horizontal, vertical, diagonal 45 degree
  if (
    (start.x == end.x ||
      start.y == end.y ||
      Math.abs(start.x - end.x) == Math.abs(start.y - end.y)) &&
    !(start.x == end.x && start.y == end.y)
  ) {
    return true;
  } else {
    return false;
  }
}
function isValidFirstNode(node) {
  if (!NodeVistied.includes(node) && isHeadOrTail(node)) {
    return true;
  } else {
    return false;
  }
}
function setHeadNode(incomingPosition) {
  headNode = incomingPosition;
}

function setTailNode(incomingPosition) {
  tailNode = incomingPosition;
}

function isHeadOrTail(incomingPosition) {
  //maybe we dont need thrid check if we are checking on validating first click
  if (
    JSON.stringify(headNode) === JSON.stringify(incomingPosition) ||
    JSON.stringify(tailNode) === JSON.stringify(incomingPosition) ||
    headNode.hasOwnProperty('x') === false
  ) {
    return true;
  } else {
    return false;
  }
}

function handleNodeClick(incomingMsg) {
  let curClickedNode = incomingMsg.body;

  if (isFirstClick) {
    if (
      isValidFirstNode(curClickedNode) &&
      (getIndexOfNode(curClickedNode) > -1 || isHeadOrTail(curClickedNode))
    ) {
      startNodePosition = curClickedNode;

      isFirstClick = false;

      firstClickedNode = curClickedNode;

      return {
        msg: 'VALID_START_NODE',
        body: {
          newLine: null,
          heading: player,
          message: null,
        },
      };
    } else {
      return {
        msg: 'INVALID_START_NODE',
        body: {
          newLine: null,
          heading: player,
          message: 'Not a valid starting position.',
        },
      };
    }
  } else {
    //check if move is octolinear, isAvailable in the Available list, and check if it is not already head or tail
    if (
      isOctoLinearMove(curClickedNode) &&
      getIndexOfNode(curClickedNode) > -1 &&
      !intersectWithCurrentLines(curClickedNode)
    ) {
      //update Head and Tail
      if (JSON.stringify(firstClickedNode) === JSON.stringify(headNode)) {
        setHeadNode(curClickedNode);
      } else if (
        JSON.stringify(firstClickedNode) === JSON.stringify(tailNode)
      ) {
        setTailNode(curClickedNode);
      } else {
        setHeadNode(firstClickedNode);
        setTailNode(curClickedNode);
      }

      //update nodes available
      updateAvailableNodes(curClickedNode);

      //check if game should be over
      let gameOver = checkGameOver();

      if (!gameOver) {
        //keep track of Lines
        saveLines(curClickedNode);
        //reset first click variable
        isFirstClick = true;
        firstClickedNode = {};
        switchPlayer();

        return {
          msg: 'VALID_END_NODE',
          body: {
            newLine: {
              start: startNodePosition,
              end: incomingMsg.body,
            },
            heading: player,
            message: null,
          },
        };
      } else {
        switchPlayer();

        return {
          msg: 'GAME_OVER',
          body: {
            newLine: {
              start: startNodePosition,
              end: incomingMsg.body,
            },
            heading: 'Game over',
            message: `Game over  ${player} wins`,
          },
        };
      }
    } else {
      isFirstClick = true;
      firstClickedNode = {};

      return {
        msg: 'INVALID_END_NODE',
        body: {
          newLine: null,
          heading: player,
          message: 'invalid move',
        },
      };
    }
  }
}

function getIndexOfNode(curNode) {
  let indexOfNode = -1;

  availableNodes.find((node, index) => {
    if (node.x === curNode.x && node.y === curNode.y) {
      indexOfNode = index;
    }
  });

  return indexOfNode;
}

function updateAvailableNodes(curNode) {
  let nodeVisited = [];

  if (curNode.y === firstClickedNode.y) {
    //horizontal
    let distance = Math.abs(curNode.x - firstClickedNode.x);
    let startX = Math.min(firstClickedNode.x, curNode.x);

    for (let i = 0; i <= distance; i++) {
      let addNode = {};
      addNode.x = startX;
      addNode.y = curNode.y;
      nodeVisited.push(addNode);
      startX++;
    }
  } else if (curNode.x === firstClickedNode.x) {
    //vertical
    let distance = Math.abs(curNode.y - firstClickedNode.y);
    let startY = Math.min(firstClickedNode.y, curNode.y);

    for (let i = 0; i <= distance; i++) {
      let addNode = {};
      addNode.x = curNode.x;
      addNode.y = startY;

      nodeVisited.push(addNode);
      startY++;
    }
  } else {
    //diagonal
    let diffInX = firstClickedNode.x - curNode.x;
    let diffInY = firstClickedNode.y - curNode.y;

    let distance = Math.floor(Math.hypot(diffInX, diffInY));

    let startX = firstClickedNode.x;
    let startY = firstClickedNode.y;

    for (let i = 0; i <= distance; i++) {
      let addNode = {};
      addNode.x = startX;
      addNode.y = startY;

      nodeVisited.push(addNode);
      if (Math.sign(diffInX) === 1) {
        startX--;
      } else if (Math.sign(diffInX) === -1) {
        startX++;
      }
      if (Math.sign(diffInY) === 1) {
        startY--;
      } else if (Math.sign(diffInY) === -1) {
        startY++;
      }
    }
  }

  nodeVisited.map((node) => {
    let index = getIndexOfNode(node);
    if (index > -1) {
      availableNodes.splice(index, 1);
    }
  });
}

function checkGameOver(curNode) {
  if (
    availableNodes === undefined ||
    availableNodes.length == 0 ||
    (checkForValidNodes(tailNode).length == 0 &&
      checkForValidNodes(headNode).length == 0) ||
    intersectTest(tailNode)
  ) {
    return true;
  } else {
    return false;
  }
}

function saveLines(curNode) {
  lines.push({
    x1: curNode.x,
    y1: curNode.y,
    x2: firstClickedNode.x,
    y2: firstClickedNode.y,
  });
}

// line intercept math by Paul Bourke http://paulbourke.net/geometry/pointlineplane/
// Determine the intersection point of two line segments
// Return FALSE if the lines don't intersect
function intersect(x1, y1, x2, y2, x3, y3, x4, y4) {
  // Check if none of the lines are of length 0
  if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
    return false;
  }

  const denominator = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);

  // Lines are parallel
  if (denominator === 0) {
    return false;
  }

  let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
  let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;

  // is the intersection along the segments
  if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
    return false;
  }

  // Return a object with the x and y coordinates of the intersection
  let x = x1 + ua * (x2 - x1);
  let y = y1 + ua * (y2 - y1);

  return { x, y };
}

function intersectWithCurrentLines(curNode) {
  let result = false;
  for (let i = 0; i < lines.length; i++) {
    let intersection = intersect(
      firstClickedNode.x,
      firstClickedNode.y,
      curNode.x,
      curNode.y,
      lines[i].x1,
      lines[i].y1,
      lines[i].x2,
      lines[i].y2
    );

    if (intersection) {
      if (JSON.stringify(intersection) !== JSON.stringify(firstClickedNode)) {
        result = true;
      }
    }
  }

  return result;
}

//To DO ** Finish
function intersectTest(curNode) {
  let result = false;
  let validNodes = checkForValidNodes(curNode);

  console.log('validnodes');
  console.log(validNodes);

  console.log('curNode');
  console.log(curNode);

  console.log('lines');
  console.log(lines);
  console.log('lines length');
  console.log(lines.length);

  console.log('validNodes.length');
  console.log(validNodes.length);

  //   if (lines.length > 0) {
  //     for (let i = 0; i < validNodes.length; i++) {
  //       console.log('jw inside');
  //       for (let j = 0; j < lines.length; j++) {
  //         console.log('hey');
  //         console.log(
  //           validNodes[i].x,
  //           validNodes[i].y,
  //           curNode.x,
  //           curNode.y,
  //           lines[j].x1,
  //           lines[j].y1,
  //           lines[j].x2,
  //           lines[j].y2
  //         );
  //         let intersection = intersect(
  //           validNodes[i].x,
  //           validNodes[i].y,
  //           curNode.x,
  //           curNode.y,
  //           lines[j].x1,
  //           lines[j].y1,
  //           lines[j].x2,
  //           lines[j].y2
  //         );

  //         if (intersection) {
  //           alert('intersection');
  //           console.log('intersection');
  //           console.log(intersection);
  //           if (
  //             JSON.stringify(intersection) !== JSON.stringify(firstClickedNode)
  //           ) {
  //             result = true;
  //           }
  //         }
  //       } // end inner for loop
  //     } // end outer for loop
  //   }

  return false;

  //loop thorugh valid Nodes and perfrom intersect test
  // if there is at least one node that is not intersecting, test is true
  //   console.log('these are valid nodes');
  //   console.log(validNodes);
  //   validNodes.map((node) => {
  //     intersect(
  //       curNode.x,
  //       curNode.y,
  //       firstClickedNode.x,
  //       firstClickedNode.y,
  //       node.x,
  //       node.y,
  //       curNode.x,
  //       curNode.y
  //     );
  //   });
}

function checkForValidNodes(curNode) {
  //check avaialble nodes around given node

  let stillAvailableNodes = [];

  availableNodes.map((node) => {
    let diffInX = curNode.x - node.x;
    let diffInY = curNode.y - node.y;

    let distance = Math.hypot(diffInX, diffInY);

    if (distance < 2) {
      stillAvailableNodes.push(node);
    }
  });
  console.log(stillAvailableNodes);
  return stillAvailableNodes;
}

function switchPlayer() {
  player = player === 'Player 1' ? 'Player 2' : 'Player 1';
}

function handleIncomingMessage(incomingMsg) {
  console.log(incomingMsg);
  if (incomingMsg.msg === 'NODE_CLICKED') {
    return handleNodeClick(incomingMsg);
  }
}
