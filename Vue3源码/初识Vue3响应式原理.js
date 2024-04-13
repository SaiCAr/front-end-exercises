let product = reactive({ price: 5, quantity: 2 });
let salePrice = ref(0);
let total = 0;

// 记录当前运行的副作用函数，避免多次收集
let activeEffect = null;
// 存放响应式对象的属性依赖关系
const targetMap = new WeakMap();

const effect = (effFn) => {
  activeEffect = effFn;
  effFn();
  activeEffect = null;
};

effect(() => {
  salePrice.value = product.price * 0.9;
  // console.log("salePrice", salePrice.value);
});

effect(() => {
  total = salePrice.value * product.quantity;
  console.log("total: " + total);
});

// 追踪副作用依赖
function track(target, key) {
  // 只有副作用函数执行时，才进行依赖收集
  if (!activeEffect) return;

  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  let deps = depsMap.get(key);
  if (!deps) {
    deps = new Set();
    depsMap.set(key, deps);
  }

  deps.add(activeEffect);
  console.log(`${key} track`);
}

// 执行依赖中的副作用
function trigger(target, key) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;
  console.log(`${key} trigger`);
  const deps = depsMap.get(key);

  if (deps) {
    deps.forEach((effect) => effect());
  }
}

// 返回响应式对象，通过拦截对象的 getter、setter
// getter: 依赖收集
// setter: 触发依赖的副作用
function reactive(target) {
  const handler = {
    get(target, key, receiver) {
      track(target, key);
      return Reflect.get(target, key, receiver);
    },
    set(target, key, value, receiver) {
      const oldValue = target[key];
      // 返回 boolean，表示是否赋值成功
      const result = Reflect.set(target, key, value, receiver);

      if (result && oldValue !== value) {
        trigger(target, key);
      }

      return result;
    },
  };

  return new Proxy(target, handler);
}

function ref(raw) {
  const r = {
    get value() {
      track(r, "value");
      return raw;
    },
    set value(newValue) {
      if (raw !== newValue) {
        raw = newValue;
        trigger(r, "value");
      }
    },
  };

  return r;
}

product.price = 10;
