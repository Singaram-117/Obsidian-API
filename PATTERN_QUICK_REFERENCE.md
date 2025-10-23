# Design Patterns Quick Reference

Quick code examples for all 13 design patterns in Obsidian MROP.

---

## 1. Singleton Pattern

```javascript
// Used in all services
import circuitBreakerService from './services/circuitBreakerService.js';
```

---

## 2. Factory Pattern

```javascript
import { MetricsAdapterFactory } from './patterns/AdapterPattern.js';

const adapter = MetricsAdapterFactory.create('prometheus');
const adapter2 = MetricsAdapterFactory.create('datadog', { apiKey: 'xxx' });
```

---

## 3. Adapter Pattern ✨

```javascript
import { UnifiedMetricsService } from './patterns/AdapterPattern.js';

const metricsService = new UnifiedMetricsService();
metricsService.registerSource('prom', 'prometheus');
metricsService.registerSource('dd', 'datadog', { apiKey: 'xxx' });

// Get metrics from any source
const metrics = await metricsService.getMetrics('prom', 'api-service', 3600000);
```

---

## 4. Decorator Pattern ✨

```javascript
import { RequestBuilder } from './patterns/DecoratorPattern.js';

const request = new RequestBuilder('payment-service', 'http://api/payment')
  .withLogging()
  .withMetrics()
  .withTracing()
  .withCaching(60000)
  .withRetry(3, 1000)
  .build();

const result = await request.execute();
```

---

## 5. Facade Pattern ✨

```javascript
import obsidian from './patterns/FacadePattern.js';

// Initialize
await obsidian.initialize({
  services: [
    {
      name: 'payment-service',
      config: {
        timeout: 5000,
        bulkhead: { maxConcurrent: 10 },
        fallback: { type: 'cache' }
      }
    }
  ]
});

// Make resilient request
const result = await obsidian.makeRequest('payment-service', '/api/charge');

// Get status
const status = await obsidian.getServiceStatus('payment-service');

// Quick setup
await obsidian.quickSetup('api-service', 'http://api', 3);
```

---

## 6. Proxy Pattern ✨

```javascript
import { ProxyFactory } from './patterns/ProxyPattern.js';

// Create resilient proxy
const proxy = ProxyFactory.createResilientProxy('payment-service');
const result = await proxy.request('http://api/payment', {
  method: 'POST',
  data: { amount: 100 }
});

// Composite proxy
const compositeProxy = ProxyFactory.createCompositeProxy('api-service', {
  resilient: true,
  logging: true,
  tokenProvider: async () => 'token-123'
});
```

---

## 7. Repository Pattern

```javascript
import Service from './models/Service.js';

// Clean data access
const service = await Service.findOne({ name: 'api-service' });
service.status = 'healthy';
await service.save();
```

---

## 8. Chain of Responsibility Pattern ✨

```javascript
import { RequestPipeline } from './patterns/ChainOfResponsibilityPattern.js';

// Default pipeline
const pipeline = new RequestPipeline().buildDefaultPipeline();

const result = await pipeline.process({
  serviceName: 'payment-service',
  url: 'http://api/payment',
  method: 'POST',
  requiresAuth: true,
  authToken: 'valid-token'
});

// Custom pipeline
import { 
  ValidationHandler, 
  CircuitBreakerHandler, 
  ExecutionHandler 
} from './patterns/ChainOfResponsibilityPattern.js';

const customPipeline = new RequestPipeline().buildCustomPipeline([
  new ValidationHandler(),
  new CircuitBreakerHandler(),
  new ExecutionHandler()
]);
```

---

## 9. Command Pattern ✨

```javascript
import {
  CommandInvoker,
  OpenCircuitCommand,
  ScaleServiceCommand,
  ChangeLoadBalancingStrategyCommand
} from './patterns/CommandPattern.js';

const invoker = new CommandInvoker();

// Execute commands
await invoker.execute(new OpenCircuitCommand('payment-service'));
await invoker.execute(new ScaleServiceCommand('api-service', 5));
await invoker.execute(new ChangeLoadBalancingStrategyCommand('least-connections'));

// Undo
await invoker.undo();

// Redo
await invoker.redo();

// View history
const history = invoker.getHistory();
```

---

## 10. Observer Pattern

```javascript
import { eventEmitter } from './services/eventService.js';

// Subscribe
eventEmitter.on('circuit:open', (data) => {
  console.log('Circuit opened:', data);
});

// Emit
eventEmitter.emit('circuit:open', {
  serviceName: 'payment-service'
});
```

---

## 11. Strategy Pattern

```javascript
import loadBalancerPattern from './patterns/LoadBalancerPattern.js';

// Change strategy at runtime
loadBalancerPattern.setStrategy('round-robin');
loadBalancerPattern.setStrategy('least-connections');
loadBalancerPattern.setStrategy('response-time');
loadBalancerPattern.setStrategy('weighted-round-robin');
```

---

## 12. State Pattern

```javascript
import circuitBreakerService from './services/circuitBreakerService.js';

const breaker = circuitBreakerService.getBreaker('payment-service');

// State transitions
breaker.close();  // Closed state
// After failures...
breaker.open();   // Open state
// After timeout...
// Half-Open state (automatic)
```

---

## 13. Producer-Consumer Pattern

```javascript
import queueService from './services/queueService.js';

// Producer
await queueService.addJob('health-check', {
  serviceName: 'payment-service'
});

// Consumer (worker process)
// Automatically processes jobs from queue
```

---

## Combined Example

```javascript
// Use multiple patterns together!

import obsidian from './patterns/FacadePattern.js';
import { CommandInvoker, OpenCircuitCommand } from './patterns/CommandPattern.js';
import { RequestBuilder } from './patterns/DecoratorPattern.js';

// 1. Setup with Facade
await obsidian.quickSetup('payment-service', 'http://payment', 3);

// 2. Make decorated request
const request = new RequestBuilder('payment-service', '/api/charge')
  .withLogging()
  .withMetrics()
  .withRetry(3, 1000);

const result = await request.execute();

// 3. Run chaos experiment with Command
const invoker = new CommandInvoker();
await invoker.execute(new OpenCircuitCommand('payment-service'));

// 4. Check status
const status = await obsidian.getServiceStatus('payment-service');

// 5. Undo chaos
await invoker.undo();
```

---

## Pattern Cheat Sheet

| Pattern | Use When | File |
|---------|----------|------|
| Singleton | Single instance needed | All services |
| Factory | Create objects dynamically | AdapterPattern.js |
| Adapter | Integrate external systems | AdapterPattern.js |
| Decorator | Add features dynamically | DecoratorPattern.js |
| Facade | Simplify complex system | FacadePattern.js |
| Proxy | Control access, add caching | ProxyPattern.js |
| Repository | Separate data access | Model files |
| Chain of Responsibility | Process through multiple handlers | ChainOfResponsibilityPattern.js |
| Command | Encapsulate actions, undo/redo | CommandPattern.js |
| Observer | Event-driven updates | eventService.js |
| Strategy | Switch algorithms at runtime | LoadBalancerPattern.js |
| State | Behavior changes with state | circuitBreakerService.js |
| Producer-Consumer | Async background jobs | queueService.js |

---

## 🎯 Most Useful for Developers

**Want simple API?** → Use **Facade Pattern**
```javascript
await obsidian.quickSetup('service', 'http://api', 3);
```

**Want to enhance requests?** → Use **Decorator Pattern**
```javascript
new RequestBuilder().withLogging().withMetrics().withRetry();
```

**Want to integrate Prometheus/Datadog?** → Use **Adapter Pattern**
```javascript
metricsService.registerSource('prom', 'prometheus');
```

**Want chaos engineering?** → Use **Command Pattern**
```javascript
await invoker.execute(new OpenCircuitCommand('service'));
```

**Want request pipeline?** → Use **Chain of Responsibility**
```javascript
const pipeline = new RequestPipeline().buildDefaultPipeline();
```

