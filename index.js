// Promise内部有三种状态
var PENDING = 'pending';
var FULFILLED = 'fulfilled';
var REJECTED = 'rejected';

function Promise(fn) {
  // 存放状态
  this.state = PENDING;         

  this.value = null; // value值在链式传递时有用
  // 存放回调函数
  this.handlers = [];

  // 观察doResolve的结构，刚好可以用来给new Promise的fn参数使用，
  // 太棒了
  doResolve(fn, this.resolve, this.rejected)
}

// 记住then方法会返回一个Promise
Promise.prototype.then = function (onFulFilled, onRejected) {
  var _that = this;
  return new Promise(function (resolve, reject) {
    _that._done(function(result) {
      try {
        if (typeof onFulFilled === 'function') {
          // then回调函数的返回值会作为下一个then回调的参数
          return resolve(onFulFilled(result)) 
        } else {
          return resolve(result)
        }
      } catch (e) {
        return reject(e)
      }
    }, function(error) {
      try {
        if (typeof onRejected === 'function') {
          return reject(onRejected(error))
        } else {
          return reject(error)
        }
      } catch (e) {
        return reject(error)
      }
      
    })
  })
}

// _done的工作就是将回调函数放入到handlers中
Promise.prototype._done = function (onFulFilled, onRejected) {
  // 确保每一次then过程都在下一次tick中执行
  setTimeout(function () {
    handle({
      onFulFilled: onFulFilled,
      onRejected: onRejected
    })
  }, 0)
}

// 用于存储then回调函数
Promise.prototype._handle = function (obj) {
  if (this.state === PENDING) {
    this.handlers.push(obj)
  }
  if (this.state === FULFILLED && typeof(obj.onFulFilled) === 'function') {
    obj.onFulFilled(this.value)
  }
  if (this.state === REJECTED && typeof(obj.onRejected) === 'function') {
    obj.onRejected(this.value)
  }
}

// 更改状态为fulfilled
Promise.prototype._fulfilled = function (result) {
  this.state = FULFILLED;
  this.value = result;
  this.handlers.forEach(handle)
  this.handlers = null
}

// 更改状态为rejected
Promise.prototype.rejected = function (error) {
  this.state = REJECTED;
  this.value = error;
  this.handlers.forEach(handle)
  this.handlers = null
}

Promise.prototype.resolve = function (result) {
  // 如果resolve参数是Promise，需要等待
  // 该Promise改变完状态才能改变自身的状态
  try {
    if (result instanceof Promise) {
    var then = getThen(result);
      if (then) {
        // 等待result这个Promise的状态完成改变才执行自身的resolve或者
        // rejected
        doResolve(then.bind(result), this.resolve, this.rejected)
        return
      }
    }
    this._fulfilled(result);
  } catch (e) {
    reject(e)
  }
}

// 拿不到then就返回null
function getThen (value) {
  var t = typeof value;
  if (value && (t === 'Object' || t === 'function')) {
    var then = value.then;
    if (typeof(then) === 'function') {
      return then;
    }
  }
  return null;
}

// 用于在then函数中执行resolve或者rejected
function doResolve(fn, onFulFilled, onRejected) {
  var done = false;
  try {
    fn(function (result) {
      if (done) return
      done = true
      onFulFilled(result)
    }, function (error) {
      if (done) return
      done = true
      onRejected(error)
    })
  } catch (e) {
    onRejected(e)
  }
}
