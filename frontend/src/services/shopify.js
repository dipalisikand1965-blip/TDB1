// Shopify Storefront API Integration
// Ready for headless commerce - just add credentials when ready

import axios from 'axios';

// Shopify Configuration - Update when ready
const SHOPIFY_CONFIG = {
  domain: process.env.REACT_APP_SHOPIFY_DOMAIN || 'YOUR_STORE.myshopify.com',
  storefrontAccessToken: process.env.REACT_APP_SHOPIFY_STOREFRONT_TOKEN || 'YOUR_TOKEN_HERE',
  apiVersion: '2024-01'
};

const STOREFRONT_API_URL = `https://${SHOPIFY_CONFIG.domain}/api/${SHOPIFY_CONFIG.apiVersion}/graphql.json`;

// GraphQL client for Shopify Storefront API
const shopifyClient = axios.create({
  baseURL: STOREFRONT_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Shopify-Storefront-Access-Token': SHOPIFY_CONFIG.storefrontAccessToken
  }
});

// Fetch all products from Shopify
export const fetchProducts = async (limit = 20) => {
  const query = `
    query GetProducts($limit: Int!) {
      products(first: $limit) {
        edges {
          node {
            id
            title
            handle
            description
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            images(first: 1) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
            variants(first: 10) {
              edges {
                node {
                  id
                  title
                  priceV2 {
                    amount
                    currencyCode
                  }
                  availableForSale
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await shopifyClient.post('', {
      query,
      variables: { limit }
    });
    
    return response.data.data.products.edges.map(edge => ({
      id: edge.node.id,
      name: edge.node.title,
      handle: edge.node.handle,
      description: edge.node.description,
      price: parseFloat(edge.node.priceRange.minVariantPrice.amount),
      currency: edge.node.priceRange.minVariantPrice.currencyCode,
      image: edge.node.images.edges[0]?.node.url || '',
      variants: edge.node.variants.edges.map(v => ({
        id: v.node.id,
        title: v.node.title,
        price: parseFloat(v.node.priceV2.amount),
        available: v.node.availableForSale
      })),
      shopifyUrl: `https://${SHOPIFY_CONFIG.domain}/products/${edge.node.handle}`
    }));
  } catch (error) {
    console.error('Shopify API Error:', error);
    // Return mock data for now
    return [];
  }
};

// Create checkout and redirect to Shopify
export const createCheckout = async (lineItems) => {
  const query = `
    mutation checkoutCreate($input: CheckoutCreateInput!) {
      checkoutCreate(input: $input) {
        checkout {
          id
          webUrl
        }
        checkoutUserErrors {
          message
          field
        }
      }
    }
  `;

  try {
    const response = await shopifyClient.post('', {
      query,
      variables: {
        input: {
          lineItems: lineItems.map(item => ({
            variantId: item.variantId,
            quantity: item.quantity
          }))
        }
      }
    });

    const checkout = response.data.data.checkoutCreate.checkout;
    return checkout.webUrl; // Redirect user to this URL
  } catch (error) {
    console.error('Checkout Creation Error:', error);
    return null;
  }
};

// Fetch single product by handle
export const fetchProductByHandle = async (handle) => {
  const query = `
    query GetProduct($handle: String!) {
      productByHandle(handle: $handle) {
        id
        title
        description
        images(first: 5) {
          edges {
            node {
              url
              altText
            }
          }
        }
        variants(first: 10) {
          edges {
            node {
              id
              title
              priceV2 {
                amount
                currencyCode
              }
              availableForSale
            }
          }
        }
      }
    }
  `;

  try {
    const response = await shopifyClient.post('', {
      query,
      variables: { handle }
    });
    return response.data.data.productByHandle;
  } catch (error) {
    console.error('Product Fetch Error:', error);
    return null;
  }
};

// Search products
export const searchProducts = async (searchQuery) => {
  const query = `
    query SearchProducts($query: String!) {
      products(first: 20, query: $query) {
        edges {
          node {
            id
            title
            handle
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            images(first: 1) {
              edges {
                node {
                  url
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await shopifyClient.post('', {
      query,
      variables: { query: searchQuery }
    });
    return response.data.data.products.edges;
  } catch (error) {
    console.error('Search Error:', error);
    return [];
  }
};

export default {
  fetchProducts,
  createCheckout,
  fetchProductByHandle,
  searchProducts
};