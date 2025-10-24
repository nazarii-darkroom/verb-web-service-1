const axios = require('axios');

// Update quantity by subscriptionId
const updateQuantityBySubscriptionId = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { quantity } = req.body;
    const { customer_id } = req.query;

    // Validate input
    if (!subscriptionId) {
      return res.status(400).json({
        error: 'Subscription ID is required'
      });
    }

    if (!customer_id) {
      return res.status(400).json({
        error: 'Customer ID is required as query parameter'
      });
    }

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        error: 'Valid quantity (minimum 1) is required'
      });
    }

    // Check for required environment variables
    if (!process.env.RECHARGE_API_TOKEN) {
      return res.status(500).json({
        error: 'Recharge API token not configured'
      });
    }

    if (!process.env.RECHARGE_API_VERSION) {
      return res.status(500).json({
        error: 'Recharge API version not configured'
      });
    }

    // First, fetch the subscription to verify customer_id
    const subscriptionResponse = await axios.get(
      `https://api.rechargeapps.com/subscriptions/${subscriptionId}`,
      {
        headers: {
          'X-Recharge-Access-Token': process.env.RECHARGE_API_TOKEN,
          'X-Recharge-Version': process.env.RECHARGE_API_VERSION,
          'Content-Type': 'application/json'
        }
      }
    );

    const subscription = subscriptionResponse.data.subscription;

    // Verify that the customer_id matches the subscription's customer_id
    if (subscription.customer_id !== parseInt(customer_id)) {
      return res.status(403).json({
        error: 'Unauthorized: Customer ID does not match subscription owner',
        provided_customer_id: customer_id,
        subscription_customer_id: subscription.customer_id
      });
    }

    // Make API call to Recharge to update subscription
    const updateResponse = await axios.put(
      `https://api.rechargeapps.com/subscriptions/${subscriptionId}`,
      {
        quantity: parseInt(quantity)
      },
      {
        headers: {
          'X-Recharge-Access-Token': process.env.RECHARGE_API_TOKEN,
          'X-Recharge-Version': process.env.RECHARGE_API_VERSION,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Update response status:', updateResponse.status);
    console.log('Update response data:', JSON.stringify(updateResponse.data, null, 2));

    // Fetch the updated subscription to get the most current data
    const fetchResponse = await axios.get(
      `https://api.rechargeapps.com/subscriptions/${subscriptionId}`,
      {
        headers: {
          'X-Recharge-Access-Token': process.env.RECHARGE_API_TOKEN,
          'X-Recharge-Version': process.env.RECHARGE_API_VERSION,
          'Content-Type': 'application/json'
        }
      }
    );

    const updatedSubscription = fetchResponse.data.subscription;
    
    console.log(`Successfully updated subscription ${subscriptionId} to quantity ${quantity}`);
    console.log('Requested quantity:', quantity);
    console.log('Actual quantity in response:', updatedSubscription.quantity);
    console.log('Full subscription response:', JSON.stringify(updatedSubscription, null, 2));
    
    // Check if the quantity was actually updated
    const quantityUpdated = updatedSubscription.quantity === parseInt(quantity);
    
    res.json({
      message: quantityUpdated ? "Quantity updated successfully" : "Quantity update may not have been applied",
      subscriptionId,
      quantity: updatedSubscription.quantity, // Use actual quantity from response
      requestedQuantity: parseInt(quantity),
      quantityUpdated: quantityUpdated,
      subscription: updatedSubscription
    });

  } catch (error) {
    console.error('Error updating subscription quantity:', error);

    // Handle specific error cases
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;

      if (status === 404) {
        return res.status(404).json({
          error: 'Subscription not found',
          subscriptionId: req.params.subscriptionId
        });
      } else if (status === 422) {
        return res.status(422).json({
          error: 'Invalid request data',
          details: errorData
        });
      } else if (status === 401) {
        return res.status(401).json({
          error: 'Unauthorized - Invalid API token'
        });
      } else {
        return res.status(status).json({
          error: 'Recharge API error',
          details: errorData
        });
      }
    } else if (error.request) {
      return res.status(503).json({
        error: 'Unable to connect to Recharge API'
      });
    } else {
      return res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
};

// Get subscription by ID
const getSubscriptionById = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { customer_id } = req.query;

    // Validate input
    if (!subscriptionId) {
      return res.status(400).json({
        error: 'Subscription ID is required'
      });
    }

    if (!customer_id) {
      return res.status(400).json({
        error: 'Customer ID is required as query parameter'
      });
    }

    // Check for required environment variables
    if (!process.env.RECHARGE_API_TOKEN) {
      return res.status(500).json({
        error: 'Recharge API token not configured'
      });
    }

    if (!process.env.RECHARGE_API_VERSION) {
      return res.status(500).json({
        error: 'Recharge API version not configured'
      });
    }

    // Fetch the subscription from Recharge API
    const subscriptionResponse = await axios.get(
      `https://api.rechargeapps.com/subscriptions/${subscriptionId}`,
      {
        headers: {
          'X-Recharge-Access-Token': process.env.RECHARGE_API_TOKEN,
          'X-Recharge-Version': process.env.RECHARGE_API_VERSION,
          'Content-Type': 'application/json'
        }
      }
    );

    const subscription = subscriptionResponse.data.subscription;

    // Verify that the customer_id matches the subscription's customer_id
    if (subscription.customer_id !== parseInt(customer_id)) {
      return res.status(403).json({
        error: 'Unauthorized: Customer ID does not match subscription owner',
        provided_customer_id: customer_id,
        subscription_customer_id: subscription.customer_id
      });
    }

    console.log(`Successfully retrieved subscription ${subscriptionId} for customer ${customer_id}`);

    res.json({
      message: "Subscription retrieved successfully",
      subscription
    });

  } catch (error) {
    console.error('Error retrieving subscription:', error);

    // Handle specific error cases
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;

      if (status === 404) {
        return res.status(404).json({
          error: 'Subscription not found',
          subscriptionId: req.params.subscriptionId
        });
      } else if (status === 401) {
        return res.status(401).json({
          error: 'Unauthorized - Invalid API token'
        });
      } else {
        return res.status(status).json({
          error: 'Recharge API error',
          details: errorData
        });
      }
    } else if (error.request) {
      return res.status(503).json({
        error: 'Unable to connect to Recharge API'
      });
    } else {
      return res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
};

// Add product to next order (onetime)
const addProductToNextOrder = async (req, res) => {
  try {
    const { charge_id } = req.params;
    const { customer_id } = req.query;
    const { product_id, variant_id, quantity = 1 } = req.body;

    // Validate input
    if (!charge_id) {
      return res.status(400).json({
        error: 'Charge ID is required'
      });
    }

    if (!customer_id) {
      return res.status(400).json({
        error: 'Customer ID is required as query parameter'
      });
    }

    if (!product_id) {
      return res.status(400).json({
        error: 'Product ID is required'
      });
    }

    if (!variant_id) {
      return res.status(400).json({
        error: 'Variant ID is required'
      });
    }

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        error: 'Valid quantity (minimum 1) is required'
      });
    }

    // Check for required environment variables
    if (!process.env.RECHARGE_API_TOKEN) {
      return res.status(500).json({
        error: 'Recharge API token not configured'
      });
    }

    if (!process.env.RECHARGE_API_VERSION) {
      return res.status(500).json({
        error: 'Recharge API version not configured'
      });
    }

    // Get charge details to extract address_id and customer_id
    console.log(`Fetching charge ${charge_id}...`);
    const chargeResponse = await axios.get(
      `https://api.rechargeapps.com/charges/${charge_id}`,
      {
        headers: {
          'X-Recharge-Access-Token': process.env.RECHARGE_API_TOKEN,
          'X-Recharge-Version': process.env.RECHARGE_API_VERSION,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Charge response status:', chargeResponse.status);
    console.log('Charge response data:', JSON.stringify(chargeResponse.data, null, 2));

    const charge = chargeResponse.data.charge;
    
    if (!charge) {
      return res.status(404).json({
        error: 'Charge data not found in response',
        order_id: parseInt(charge_id),
        response_data: chargeResponse.data
      });
    }

    const chargeCustomerId = charge.customer.id;
    const address_id = charge.address_id;

    if (!chargeCustomerId) {
      return res.status(400).json({
        error: 'Charge does not have a customer_id',
        charge_id: parseInt(charge_id)
      });
    }

    if (!address_id) {
      return res.status(400).json({
        error: 'Charge does not have an address_id',
        charge_id: parseInt(charge_id)
      });
    }

    // Verify that the customer_id matches the order's customer_id
    if (chargeCustomerId !== parseInt(customer_id)) {
      return res.status(403).json({
        error: 'Unauthorized: Customer ID does not match order owner',
        provided_customer_id: customer_id,
        charge_customer_id: orderCustomerId,
        charge_id: parseInt(order_id)
      });
    }

    console.log(`Using address ${address_id} from charge ${charge_id} for customer ${chargeCustomerId}`);

    // Create onetime product for next order
    const onetimeData = {
      add_to_next_charge: true,
      address_id: parseInt(address_id),
      external_product_id: {
        ecommerce: product_id
      },
      external_variant_id: {
        ecommerce: variant_id
      },
      quantity: parseInt(quantity)
    };

    console.log('Creating onetime product:', JSON.stringify(onetimeData, null, 2));

    const onetimeResponse = await axios.post(
      'https://api.rechargeapps.com/onetimes',
      onetimeData,
      {
        headers: {
          'X-Recharge-Access-Token': process.env.RECHARGE_API_TOKEN,
          'X-Recharge-Version': process.env.RECHARGE_API_VERSION,
          'Content-Type': 'application/json'
        }
      }
    );

    const onetime = onetimeResponse.data.onetime;

    console.log(`Successfully added product to next charge for customer ${chargeCustomerId} using charge ${charge_id}`);

    res.json({
      message: "Product added to next order successfully",
      order_id: parseInt(order_id),
      customer_id: parseInt(orderCustomerId),
      address_id: parseInt(address_id),
      onetime: onetime
    });

  } catch (error) {
    console.error('Error adding product to next order:', error);

    // Handle specific error cases
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;

      console.log('API Error Status:', status);
      console.log('API Error Data:', JSON.stringify(errorData, null, 2));

      if (status === 404) {
        return res.status(404).json({
          error: 'Charge not found',
          order_id: req.params.order_id,
          details: errorData,
          suggestion: 'Please verify the charge ID exists in your Recharge account'
        });
      } else if (status === 422) {
        return res.status(422).json({
          error: 'Invalid request data',
          details: errorData
        });
      } else if (status === 401) {
        return res.status(401).json({
          error: 'Unauthorized - Invalid API token'
        });
      } else {
        return res.status(status).json({
          error: 'Recharge API error',
          details: errorData
        });
      }
    } else if (error.request) {
      return res.status(503).json({
        error: 'Unable to connect to Recharge API'
      });
    } else {
      return res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
};

// Test customer access (for debugging)
const testCustomerAccess = async (req, res) => {
  try {
    const { customer_id } = req.params;

    if (!customer_id) {
      return res.status(400).json({
        error: 'Customer ID is required'
      });
    }

    console.log(`Testing customer access for ${customer_id}...`);

    const customerResponse = await axios.get(
      `https://api.rechargeapps.com/customers/${customer_id}`,
      {
        headers: {
          'X-Recharge-Access-Token': process.env.RECHARGE_API_TOKEN,
          'X-Recharge-Version': process.env.RECHARGE_API_VERSION,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Customer test response:', JSON.stringify(customerResponse.data, null, 2));

    res.json({
      message: "Customer access test successful",
      customer_id: parseInt(customer_id),
      customer: customerResponse.data.customer,
      has_default_address: !!customerResponse.data.customer?.default_address
    });

  } catch (error) {
    console.error('Customer access test failed:', error);

    if (error.response) {
      return res.status(error.response.status).json({
        error: 'Customer access test failed',
        status: error.response.status,
        details: error.response.data,
        customer_id: req.params.customer_id
      });
    } else {
      return res.status(500).json({
        error: 'Internal server error during customer test'
      });
    }
  }
};

module.exports = { updateQuantityBySubscriptionId, getSubscriptionById, addProductToNextOrder, testCustomerAccess };
