//var server = "http://192.168.11.8:";
var server = "http://localhost:"

var socket;

var loginInfo;
var room;

function networkInit() {
	// サーバーに接続
	socket = io.connect(server + '8080');
	
	// 通信開始
	socket.on('connect', function() {
		debug.println("connect to server.");

		// ロビー情報受取
		socket.on('lobby_info', function(data) {
			lobby.lobby_info(data);
		});

		// 部屋の出入り情報受取
		socket.on('room_info', function(data) {
			lobby.room_info(data);
		});

		// チャットメッセージ受信
		socket.on('receiveMessage', function(data) {
			lobby.receiveMessage(data);
		});

	});
}

// 部屋に入る
function enterRoom(roomid) {
	// 部屋に接続して入る
	room = new roomManager(roomid);
}

// ログイン
function Login(name, pass) {
	// 初期化
	networkInit();
	
	// ログイン処理
	loginInfo.name = name;
	loginInfo.pass = pass;
	socket.emit('login', {name: name, pass: pass}, function(ret) {
		if( ret.result ) {
			suc = NET_SUCCESS;
			loginInfo.id = ret.id;
			debug.println("login success. (id:"+ret.id+")");

			// ロビーに入る
			lobby.enter();
		} else {
			this.suc = NET_FAIL;
			debug.println("login fail.");
		}
	});
}


// ログイン情報
function loginManager() {
	this.name = "";
	this.pass = "";
	this.id = "";
	this.suc = 0;
}

// ロビー管理
function lobbyManager() {
	this.member = {};

	// ロビーに入る
	this.enter = function() {
		debug.println("lobby_enter send.");

		socket.emit('lobby_enter', {name: loginInfo.name}, function(suc) {
			if( suc ) {
				debug.println("lobby_enter success.");

				// DOMをロビーように
				setDOM(DOM_LOBBY);
			} else {
				debug.println("lobby_enter fail.");
			}
		});

		// 部屋情報受け取り
		this.room_info_require();
	};

	// ロビー情報受取
	this.lobby_info = function(data) {
		debug.println("lobby_info received.");

		this.member = data;
		for( var id in this.member ) {
			debug.println(this.member[id]);
		}
	};

	// 部屋の出入り情報受け取り
	this.room_info = function(data) {
		debug.println("room_info received.");

		var i = data.number;
		var text = "Room"+i+": ";
		for( var id in data.member ) {
			text += data.member[id] + " , ";
		}
		$("div#"+i).text(text);
	};

	// 部屋の情報要求
	this.room_info_require = function() {
		debug.println("room_info_require send.");

		socket.emit('room_info_require', null, function(suc) {
			if( suc ) {
				debug.println("room_info_require success.");
			} else {
				debug.println("room_info_require fail.");
			}
		}); 
	};

	// 発言
	this.sendMessage = function(mes) {
		debug.println("sendMessage send.");

		socket.emit('sendMessage', {id: loginInfo.id, message: mes});
	};

	// 発言受信
	this.receiveMessage = function(data) {
		debug.println("receiveMessage received.");

		// チャット表示
		var text = data.name + " > " + data.message + "\n" + $("textarea#chat").val();
		$("textarea#chat").val(text);
	};
}

// 部屋管理
function roomManager(index) {
	this.number = index;
	this.socket = io.connect(server + '8080/room/'+index);
	this.opponent = {id:0, name:""};

	// 部屋に入る
	this.enter = function(purpose) {
		debug.println("room_enter send. (room"+this.number+")");

		this.socket.emit('room_enter', {purpose: purpose, name: loginInfo.name}, function(suc) {
			if( suc ) {
				debug.println("room_enter success. (room"+this.number+")");

				// DOMを部屋に
				setDOM(DOM_ROOM);

				// ゲーム初期化
				initGame();
			} else {
				debug.println("room_enter fail. (room"+this.number+")");
			}
		});
	};

	// カレントぷよの情報をおくる
	this.sendCurrent = function() {
		var data = {
			opponent: this.opponent,
			ctype: current.pare.ctype,
			pos: current.pare.pos,
			r: current.pare.rot,
			fix: current.pare.isfix,
		};
		this.socket.emit('game_current_info_send', data);
	};

	(function(r) {
		r.socket.on('connect', function() {
			debug.println("connect to room.");

			// 入る
			r.enter(ROOM_MEMBER);
		});

		// ゲームスタート受け取り
		r.socket.on('gameStart', function(data) {
			debug.println("game start! (seed:"+data.seed+")");

			// 敵情報セット
			for( var id in data.member ) {
				if( id != loginInfo.id ) {
					r.opponent.id = id;
					r.opponent.name = data.member[id];
				}
			}
			debug.println("opponent: " + r.opponent.id + ", " + r.opponent.name);

			// 乱数のシードセット
			xors.seed(data.seed);

			scene = SCENE_GAME;
		});

		// カレントぷよ情報受取
		r.socket.on('game_current_info_receive', function(data) {
			if( !opcurrent ) opcurrent = new parePuyo([0,0], [0,0], 0, false, 1);
			opcurrent.ctype[0] = data.ctype[0];
			opcurrent.ctype[1] = data.ctype[1];
			opcurrent.pos[0] = data.pos[0];
			opcurrent.pos[1] = data.pos[1];
			opcurrent.rot = data.r;
			opcurrent.isfix = data.fix;
		});
	})(this);
}
