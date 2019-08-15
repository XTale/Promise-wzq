# Promise-wzq
手动实现一个Promsie

Promise实现核心：
1. 内部需要有个存放3种状态的state属性，分别为pending, fulfilled和rejected.
2. 内部需要有个存放回调函数的handlers队列.
3. 通过then来添加回调函数（无论resolve回调还是reject回调）, 再通过resolve和reject来调用回调函数.
