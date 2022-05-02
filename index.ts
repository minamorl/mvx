const generateProxy: any = (parentTarget: any, propertyKey: string, [ref, ...rest]: string[], searched: string[], id: string) => {
  return new Proxy(parentTarget, {
    get: (target, p) => {
      const searched_tmp = searched.concat([ref, ...rest])
      if (searched_tmp.join("") === id){
        return target[propertyKey]
      }
      return generateProxy(parentTarget, propertyKey, rest, searched.concat([ref]), id)
    }
  })
}

const path: (...args: string[]) => MethodDecorator = function(...args) {
  return (target, propertyKey, descriptor) => {
    const p = generateProxy(target, propertyKey, [...args], [], args.join(""));
    const resolver_proxies: Map<string, any> = (target as any)[Symbol.for('resolver_proxies')] ?? new Map();
    resolver_proxies.set([...args, "handler"].join(""), p);
    (target as any)[Symbol.for('resolver_proxies')] = resolver_proxies;
    return descriptor 
  }
}

class Example {
  resolvers: (searcheed: string[]) => any = (searched = []) => new Proxy(this, {
      get: (target, handler) => {
        let proxies = this.proxies();
       console.log([...searched, handler.toString()].join("")) 
        if (proxies.has([...searched, handler.toString()].join(""))) {
          return proxies.get([...searched, handler.toString()].join(""))[handler]
        }
        return this.resolvers([...searched, handler.toString()])
      }
    })
  private proxies(): Map<string, any> {
    return ((this as any)[Symbol.for('resolver_proxies')] as Map<string, any>)
  }
  @path("div", "div")
  test() {
    return "test1"
  }
  @path("h1", "div", "span")
  test2() {
    return 'test2'
  }
  @path("div", "div", "div")
  test3() {
    return 'test3'
  }
}

const instance = new Example() as any
console.log('Example', instance.resolvers().div.div.handler())
// console.log('Example', instance.resolvers().div.div.div.div)
console.log('Example', instance.resolvers().h1.div.span.handler())
console.log('Example', instance.resolvers().div.div.div.handler())