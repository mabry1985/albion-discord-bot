const request = require("request");
const config = require("./config.json");

var lastRecordedKill = -1;

/**
 * Fetch recent kills from the Gameinfo API
 * @param  {Number} limit  [max kills to get]
 * @param  {Number} offset [offset for first kill]
 * @return {json} [json array of events]
 */
function fetchKills(bot, limit = 51, offset = 0) {
  console.log("fetching kills");
  request(
    {
      uri:
        "https://gameinfo.albiononline.com/api/gameinfo/events?limit=" +
        limit +
        "&offset=" +
        offset,
      json: true,
    },
    function (error, response, body) {
      if (!error && response.statusCode === 200) {
        parseKills(bot, body);
      } else {
        console.log("Error: ", error); // Log the error
      }
    }
  );
}

/**
 * Parse returned JSON from Gameinfo to
 * find alliance members on the killboard
 * @param  {json} events
 */
function parseKills(bot, events) {
  //console.log(events);
  var breaker = lastRecordedKill;

  events.some(function (kill, index) {
    // Save the most recent kill for tracking
    if (index == 0) {
      lastRecordedKill = kill.EventId;
    }

    // Don't process data for the breaker KILL
    if (kill.EventId != breaker) {
      if (kill.Killer.Name === "garbunia" || kill.Victim.Name === "garbunia") {
        console.log("Garbunia")
        postKill(bot, kill);
      } else if (kill.Killer.Name === "Chukzzz" || kill.Victim.Name === "Chukzzz") {
        console.log("Chukzzz")
        postKill(bot, kill);
      } else {
        return
      }
    }

    return kill.EventId == breaker;
  });

  // console.log('- Skipped ' + count + ' kills');
}

function postKill(bot, kill) {
  //quick fix to not post kills with 0 fame (like arena kills after the patch)
  if (kill.TotalVictimKillFame == 0) {
    return;
  }

  var victory = false;
  if (
    kill.Killer.AllianceName.toLowerCase() ==
      config.allianceName.toLowerCase() ||
    kill.Killer.GuildName.toLowerCase() == config.guildName.toLowerCase()
  ) {
    victory = true;
  }

  var assistedBy = "";
  if (kill.numberOfParticipants == 1) {
    var soloKill = [
      "All on their own",
      "Without assistance from anyone",
      "All by himself",
      "SOLO KILL",
    ];
    assistedBy = soloKill[Math.floor(Math.random() * soloKill.length)];
  } else {
    var assists = [];
    kill.Participants.forEach(function (participant) {
      if (participant.Name != kill.Killer.Name) {
        assists.push(participant.Name);
      }
    });
    assistedBy = "Assisted By: " + assists.join(", ");
  }

  itemCount = 0;
  kill.Victim.Inventory.forEach(function (inventory) {
    if (inventory !== null) {
      itemCount++;
    }
  });

  var itemsDestroyedText = "";
  if (itemCount > 0) {
    itemsDestroyedText = " destroying " + itemCount + " items";
  }

  var embed = {
    color: victory ? 0x008000 : 0x800000,
    author: {
      name: kill.Killer.Name + " killed " + kill.Victim.Name,
      icon_url: victory
        ? "https://i.imgur.com/CeqX0CY.png"
        : "https://albiononline.com/assets/images/killboard/kill__date.png",
      url: "https://albiononline.com/en/killboard/kill/" + kill.EventId,
    },
    title: assistedBy + itemsDestroyedText,
    description: "Gaining " + kill.TotalVictimKillFame + " fame",
    thumbnail: {
      url: kill.Killer.Equipment.MainHand.Type
        ? "https://gameinfo.albiononline.com/api/gameinfo/items/" +
          kill.Killer.Equipment.MainHand.Type +
          ".png"
        : "https://albiononline.com/assets/images/killboard/kill__date.png",
    },
    timestamp: kill.TimeStamp,
    fields: [
      {
        name: "Killer Guild",
        value:
          (kill.Killer.AllianceName
            ? "[" + kill.Killer.AllianceName + "] "
            : "") + (kill.Killer.GuildName ? kill.Killer.GuildName : "<none>"),
        inline: true,
      },
      {
        name: "Victim Guild",
        value:
          (kill.Victim.AllianceName
            ? "[" + kill.Victim.AllianceName + "] "
            : "") + (kill.Victim.GuildName ? kill.Victim.GuildName : "<none>"),
        inline: true,
      },
      {
        name: "Killer IP",
        value: kill.Killer.AverageItemPower.toFixed(2),
        inline: true,
      },
      {
        name: "Victim IP",
        value: kill.Victim.AverageItemPower.toFixed(2),
        inline: true,
      },
    ],
    footer: {
      text: "Kill #" + kill.EventId,
    },
  };

  console.log(embed);
  console.log(bot.channels);

  bot.channels.get("804085931145297971").send({
    embed: embed,
  });
}

exports.fetchKills = fetchKills