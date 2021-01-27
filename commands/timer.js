function dgTimer(msg) {
  msg.reply('Time to dive!')
}

module.exports = {
  name: '!dgt',
  description: 'Solo dungeon timer.',
  execute(msg, args) {
    msg.reply('Timer set')
    setTimeout(function() {
      dgTimer(msg);
    }, 90000)
  }
}