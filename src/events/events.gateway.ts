// // import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
// // import { Server } from "socket.io";

// // @WebSocketGateway({
// //   cors: { origin: "*" }, // In production, restrict this to your frontend URL
// // })
// // export class EventsGateway {
// //   @WebSocketServer()
// //   server!: Server;

// //   // Method to call when an order is created
// //   sendOrderNotification(data: any) {
// //     this.server.emit("newOrder", data);
// //   }
// // }

// import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
// import { Server } from "socket.io";

// @WebSocketGateway({
//   cors: { origin: "*" },
// })
// export class EventsGateway {
//   @WebSocketServer()
//   server!: Server;

//   emitOrderCreated(order: any) {
//     this.server.emit("orderCreated", order);
//   }
// }
