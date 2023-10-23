/**
 * order controller
 */

import { factories } from "@strapi/strapi";
import { isValidPostalCode } from "../services/coverageService";
import { createSku } from "../services/generateSku";
import { emailToCustomer } from "../services/emailService";

export default factories.createCoreController(
  "api::order.order",
  ({ strapi }) => ({
    async donate(ctx): Promise<any> {
      try {
        const sanitizedQueryParams = await this.sanitizeQuery(ctx);
        const authenticatedUser = ctx.state.user;
        const { order_meta } = ctx.request.body;
        const order = await strapi
          .service("api::order.order")
          .findOne(sanitizedQueryParams, {
            populate: ["order_items", "order_meta"],
          });

        /***** Rest of the code here *****/

        // Checking delivery code
        if (!isValidPostalCode(order_meta.shipping_postcode)) {
          return {
            error: "Codigo Postal Invalido",
          };
        }

        //MANAGE DATABASE
        //Update existing order
        await strapi.entityService.update("api::order.order", order.id, {
          data: {
            status: "cancelled",
          },
        });

        //New donation order
        const newOrder = await strapi.entityService.create("api::order.order", {
          data: {
            status: "processing",
            type: "donation",
            user: authenticatedUser,
          },
        });

        // //New order-meta linked to new order
        const newOrder_meta = await strapi.entityService.create(
          "api::order-meta.order-meta",
          {
            data: {
              shipping_firstname: order_meta.shipping_firstname,
              shipping_postcode: order_meta.shipping_postcode,
              order: newOrder.id,
            },
          }
        );

        // New order-item linked to new order
        await strapi.entityService.create("api::order-item.order-item", {
          data: {
            ...order.order_items[0],
            sku: await createSku(),
            order: newOrder.id,
            id: null,
          },
        });

        //Send email to customer
        emailToCustomer(order_meta.shipping_firstname);

        return { order: newOrder, order_meta: newOrder_meta };
      } catch (error) {
        console.error("Error exporting orders", error);
        return (ctx.status = 500);
      }
    },
  })
);
