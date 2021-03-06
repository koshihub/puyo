
var field;
var puyo = [];
var current;
var next, nextnext, opcurrent;

// メインループ
function mainLoop() {
	switch( scene ) {
	case SCENE_WAIT:
		break;
	case SCENE_GAME:
		var prevx = current.pare.pos[0];
		var prevy = current.pare.pos[1];
		var prevr = current.pare.rot;
		var prevfix = current.pare.isfix;

		// 固定
		if( current.pare.isfix ) {
			var animation = false;
			$.each( puyo, function(i) {
				if( puyo[i].fl == 0 &&
					(puyo[i].fixtimer > 0 || (puyo[i].isvanish && puyo[i].vanishtimer > 0)) ) {
					animation = true;
				}
			});
			
			// すべてのアニメーションが終了したら
			if( !animation ) {
				// 消去判定
				if( !vanish(0) ) {
					// あたらしいぷよ
					current = new currentPuyo(next.ctype);
					next = nextnext;
					nextnext = new parePuyo([xors.rand(1,4), xors.rand(1,4)], [0,0], 2, false, 0);
				}
			}
		} else {
			// currentの回転
			if( keyQueue.z ) { current.rotate( 1 ); debug.println("z"); }
			if( keyQueue.x ) current.rotate( -1 );
			
			// currentの自然落下
			current.nfall();
			
			// currentの移動
			if( keyQueue.l || keyQueue.r ) current.movetimer = 100;
			if( keyState.l ) current.move( -1 );
			else if( keyState.r ) current.move( 1 );
			
			// currentの下移動
			if( keyQueue.d ) current.flltimer = 100;
			if( keyState.d ) current.fall();
		}

		// currentを動かしたあとに、動いた形跡があれば通知
		if( prevx != current.pare.pos[0] || prevy != current.pare.pos[1] ||
			prevr != current.pare.rot || prevfix != current.pare.isfix ) {
			//debug.println("current update!");
			room.sendCurrent();
		}

		// 敵のカレントぷよの固定
		if( opcurrent && opcurrent.isfix ) {
			opcurrent.fixcount = FIXCOUNT+1;
			opcurrent.fix();
			opcurrent = null;
		}
			var animation = false;
			$.each( puyo, function(i) {
				if( puyo[i].fl == 1 &&
					(puyo[i].fixtimer > 0 || (puyo[i].isvanish && puyo[i].vanishtimer > 0)) ) {
					animation = true;
				}
			});
			
			// すべてのアニメーションが終了したら
			if( !animation ) {
				// 消去判定
				if( !vanish(1) ) {
				}
			}

		// 個別ぷよの移動
		if( current.pare.isfix ) {
			for( i=0; ; i++ ) {
				if( !puyo[i] ) break;
				if( puyo[i].fl == 1 ) continue;
				
				// 消滅
				if( puyo[i].isvanish && puyo[i].vanishtimer == 0 ) {
					puyo.splice(i, 1);
					i --;
				}
				// 移動
				else {
					puyo[i].move();
				}
			}
		}
		if( !opcurrent ) {
			for( i=0; ; i++ ) {
				if( !puyo[i] ) break;
				if( puyo[i].fl == 0 ) continue;
				
				// 消滅
				if( puyo[i].isvanish && puyo[i].vanishtimer == 0 ) {
					puyo.splice(i, 1);
					i --;
				}
				// 移動
				else {
					puyo[i].move();
				}
			}
		}

		debug.clear();
		debug.print(puyo.length);
		break;
	}
	
	// 描画
	draw();
	
	keyQueue.reset();
}

function draw() {
	// クリア
	ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
	
	switch( scene ) {
	case SCENE_WAIT:
		// フィールド描画
		showField();
		
		// 対戦相手募集中
		ctx.fillText("対戦者募集中...", 20, 50);
		break;
	case SCENE_GAME:
		// フィールド描画
		showField();
		
		// カレントぷよ描画
		if( !current.pare.isfix ) current.pare.draw(0, 0);
		if( opcurrent ) opcurrent.draw(FIELD_WIDTH+CENTER_WIDTH, 0);

		// ネクスト、ネクネク描画
		next.draw(FIELD_WIDTH+10, 10);
		nextnext.draw(FIELD_WIDTH+20, 50);

		// 全ぷよ
		$.each( puyo, function(i) {
			puyo[i].draw();
		});
		break;
	}
}


function initGame() {
	// フィールド(6x13)
	field = new Array(2);
	$.each(field, function(i) { 
		field[i] = new Array(6);
		$.each(field[i], function(j) {
			field[i][j] = new Array(13);
			$.each(field[i][j], function(k) { field[i][j][k] = 0; });
		});
	});

	// 初期化
	current = new currentPuyo([xors.rand(1,4), xors.rand(1,4)]);
	next = new parePuyo([xors.rand(1,4), xors.rand(1,4)], [0,0], 2, false, 0);
	nextnext = new parePuyo([xors.rand(1,4), xors.rand(1,4)], [0,0], 2, false, 0);
	//opcurrent = new parePuyo([1,1], [0,0], 0, false, 1);

	for(var i=0; i<200; i++ ) {
		puyo.push(new puyoObject(1, [0, 5], i%2));
	}

	// シーン変更
	scene = SCENE_WAIT;

	// メインループ開始
	setInterval(mainLoop, 1000/FPS);
}

function showField() {
	
	// 背景ブロック
	for( v=0; v<2; v++ ) {
		for( x=0; x<6; x++ ) {
			for( y=0; y<12; y++ ) {
				var offsetx = v * (FIELD_WIDTH + CENTER_WIDTH);
				var offsety = TITLE_HEIGHT;
				var dx = offsetx + x*BLOCK_SIZE;
				var dy = offsety + (11-y)*BLOCK_SIZE;
				
				ctx.drawImage(img.block, dx, dy, BLOCK_SIZE, BLOCK_SIZE);
			}
		}
	}
}

function vanish(fl) {
	var vlist = [];
	var f = new Array(6);
	$.each(f, function(i) {
		f[i] = new Array(13);
		$.each(f[i], function(j) {
			f[i][j] = field[fl][i][j];
		});
	});
	
	var rec = function(f, p, t, list) {
		var x = p[0], y = p[1];
		
		// 盤外
		if( x < 0 || x > 5 || y < 0 || y > 12 ) return;
		
		// 同色チェック
		if( f[x][y] == t ) {
			list.push([x, y]);
			f[x][y] = 0;
			rec(f, [x+1, y], t, list);
			rec(f, [x-1, y], t, list);
			rec(f, [x, y+1], t, list);
			rec(f, [x, y-1], t, list);
		}
	};
	
	for( i=0; i<6; i++ ) {
		for( j=0; j<13; j++ ) {
			if( f[i][j] != 0 ) {
				var list = [];
				rec(f, [i,j], f[i][j], list);
				if( list.length >= 4 ) vlist.push(list);
			}
		}
	}
	
	$.each(vlist, function(i) {
		$.each(vlist[i], function(j) {
			var x = vlist[i][j][0], y = vlist[i][j][1];
			field[fl][x][y] = 0;
			$.each(puyo, function(p) {
				if( puyo[p].fl == fl && // このぷよの画面が一致しているか
					puyo[p].fixedpos[0] == x && puyo[p].fixedpos[1] == y ) {
					puyo[p].isvanish = true;
				}
			});
		});
	});
	
	if( vlist.length == 0 ) return false;
	else return true;
}

//-----------------------------------------------
// オブジェクト
//-----------------------------------------------

// ぺあぷよ
function parePuyo(type, pos, rot, isfix, fl) {
	this.ctype = [type[0], type[1]];
	this.pos = [pos[0], pos[1]];
	this.rot = rot;	 // 0:↓ 1:← 2:↑ 3:→
	this.isfix = isfix;
	this.fl = fl;	// 0: 左フィールド　1:　右フィールド
	this.alive = false;
	this.fixcount = 0;
	
	this.draw = function(offx, offy) {
		ctx.drawImage(
			img.puyo[this.ctype[0]-1],
			offx + this.pos[0],
			offy + this.pos[1] + TITLE_HEIGHT,
			BLOCK_SIZE, BLOCK_SIZE);
		ctx.drawImage(
			img.puyo[this.ctype[1]-1], 
			offx + this.pos[0] + ((this.rot-2)%2)*BLOCK_SIZE, 
			offy + this.pos[1] + ((1-this.rot)%2)*BLOCK_SIZE + TITLE_HEIGHT,
			BLOCK_SIZE, BLOCK_SIZE);
	};

	// 固定
	this.fix = function() {
		this.fixcount ++;
		if( this.fixcount > FIXCOUNT ) {
			for( n=0; n<2; n++ ) {
				var y = this.getYIndex(n);
				var x = this.getXIndex(n);
				puyo.push(new puyoObject(this.ctype[n], [x, y[0]], this.fl));
			}
			this.isfix = true;
		}
	};

	this.getXIndex = function(n) {
		if( n == 0 ) {
			return (this.pos[0] / BLOCK_SIZE);
		} else {
			return (this.pos[0] / BLOCK_SIZE + ((this.rot-2)%2));
		}
	};
	this.getYIndex = function(n) {
		if( n == 0 ) {
			return [11-Math.floor(this.pos[1]/BLOCK_SIZE), 
					11-Math.floor((this.pos[1]+BLOCK_SIZE/2)/BLOCK_SIZE)];
		} else {
			return [11-(Math.floor(this.pos[1]/BLOCK_SIZE) + ((1-this.rot)%2)), 
					11-(Math.floor((this.pos[1]+BLOCK_SIZE/2)/BLOCK_SIZE) + ((1-this.rot)%2))];
		}
	};
}

// カレントぷよ
function currentPuyo(ctype) {
	this.pare = new parePuyo(ctype, [BLOCK_SIZE*2, -BLOCK_SIZE], 2, false, 0);
	
	// タイマー
	this.nfalltimer = 0;
	this.falltimer = 0;
	this.movetimer = 0;
	
	// 回転
	this.rotate = function(d) {
		// 回転してみる
		this.pare.rot = (this.pare.rot + d + 4) % 4;
		
		// 当たり判定
		if( this.collision() ) {
			switch( this.pare.rot ) {
			case 0:
				this.pare.pos[1] = Math.floor((this.pare.pos[1]-BLOCK_SIZE/2)/BLOCK_SIZE)*BLOCK_SIZE;
				this.nfalltimer = 0;
				break;
			case 1:
			case 3:
				var sign = 2-this.pare.rot;
			
				// 動かしてみる
				this.pare.pos[0] += sign*BLOCK_SIZE;
				
				// 当たり判定
				if( this.collision() ) {
					// 戻してもう一回回転
					this.pare.pos[0] -= sign*BLOCK_SIZE;
					this.rotate(d);
				}
				break;
			}
		}
	};
	
	// 自然落下
	this.nfall = function() {
		this.nfalltimer ++;
		if( this.nfalltimer > TIME_NFALL*FPS/1000 ) {
			this.fallput();
			this.nfalltimer = 0;
		}
	};
	
	// キーダウン落下
	this.fall = function() {
		this.falltimer ++;
		if( this.falltimer > TIME_FALL*FPS/1000 ) {
			this.fallput();
			this.falltimer = 0;
		}
	};
	
	// 接地＆接地判定
	this.fallput = function() {
		// とりあえず移動
		this.pare.pos[1] += BLOCK_SIZE/2;
	
		// 接地した
		if( this.collision() ) {
			this.pare.pos[1] -= BLOCK_SIZE/2;
			this.pare.fix();
		}
	};
	
	// 左右移動
	this.move = function(d) {
		this.movetimer ++;
		if( this.movetimer > TIME_MOVE*FPS/1000 ) {
			// とりあえず移動
			this.pare.pos[0] += d * BLOCK_SIZE;
			
			// 当たり判定して戻す
			if( this.collision() ) {
				this.pare.pos[0] -= d * BLOCK_SIZE;
			}
			this.movetimer = 0;
		}
	};
	
	// 当たり判定
	this.collision = function() {
		var col = false;
		
		// 当たり判定
		for( n=0; n<2; n++ ) {
			var y = this.pare.getYIndex(n);
			var x = this.pare.getXIndex(n);
			if( x < 0 || x > 5 || y[0] < 0 || y[1] < 0 ) col = true;
			else {
				for( i=0; i<y.length; i++ ) {
					if( field[0][x][y[i]] > 0 ) {
						col = true;
						break;
					}
				}
			}
		}
		
		return col;
	};
}

// 個別ぷよ
function puyoObject(ctype, pos, fl) {
	this.ctype = ctype;
	this.pos = [pos[0]*BLOCK_SIZE, (11-pos[1])*BLOCK_SIZE];
	this.spy = 0;
	this.isvanish = false;
	this.fl = fl;

	this.fixtimer = TIME_FIX*FPS/1000;
	this.vanishtimer = TIME_VANISH*FPS/1000;
	this.fixedpos = [pos[0], pos[1]];
	
	this.draw = function() {
		ctx.drawImage(
			img.puyo[this.ctype-1],
			this.pos[0] + (CENTER_WIDTH+FIELD_WIDTH)*this.fl, this.pos[1] + TITLE_HEIGHT,
			BLOCK_SIZE, BLOCK_SIZE);
	};

	this.move = function() {
		// 自然落下
		this.spy += GRAVITY;
		if( this.spy > MAXSPEED ) this.spy = MAXSPEED;
		this.pos[1] += this.spy;
		
		// 判定
		var x = this.getXIndex(), y = this.getYIndex();
		if( field[this.fl][x][y] > 0 || y < 0) {
			// 戻す
			this.pos[1] = (11-y-1) * BLOCK_SIZE;
			this.spy = 0;
			
			// アニメーション
			this.fixtimer --;
			if( this.fixtimer > 0 ) {
				//
				// ふにょふにょ
				//
			} else {
				this.fixtimer = 0;
			}
			
			// フィールド書き換え
			field[this.fl][x][y+1] = this.ctype;
			this.fixedpos[0] = x; 
			this.fixedpos[1] = y+1;
		} else {
			// 落下したのでアニメーションカウント復活
			this.fixtimer = TIME_FIX*FPS/1000;
			
			// フィールド書き換え
			field[this.fl][x][y+1] = 0;
		}
		
		// 消えるときのアニメーション
		if( this.isvanish ) {
			this.vanishtimer --;
			if( this.vanishtimer < 0 ) {
				
			} 
		}
	};
	
	this.getXIndex = function(n) {
		return (this.pos[0] / BLOCK_SIZE);
	};
	this.getYIndex = function(n) {
		return (11-Math.ceil(this.pos[1]/BLOCK_SIZE));
	};
}