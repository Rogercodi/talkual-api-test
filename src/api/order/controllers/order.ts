/**
 * order controller
 */

import { factories } from '@strapi/strapi'
import { isValidPostalCode } from '../services/coverageService'

export default factories.createCoreController('api::order.order', ({ strapi }) => ({
  async donate (ctx): Promise<any> {
    try {
      const sanitizedQueryParams = await this.sanitizeQuery(ctx);
      const authenticatedUser = ctx.state.user;
      const { order_meta } = ctx.request.body;
      const order = await strapi.service('api::order.order').findOne(sanitizedQueryParams, { populate: ['order_items', 'order_meta'] });

      /***** Rest of the code here *****/

      // Checking delivery code
      if (!isValidPostalCode(order_meta.shipping_postcode)) {
        return {
          error: "Codigo Postal Invalido"
        };
      }

      return {order, order_meta, authenticatedUser};
    } catch (error) {
      console.error('Error exporting orders', error);
      return ctx.status = 500;
    }
  },
}));
