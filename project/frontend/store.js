import {
    newProductReducer,
    newReviewReducer,
    productDetailsReducer,
    productReducer,
    productReviewsReducer,
    productsReducer,
    reviewReducer,
  } from "./reducers/productReducer";
const reducer = combineReducers({
    products: productsReducer,
})

const initialState = {
    count: 0,
};
  
//   function counterReducer(state = initialState, action) {
//     switch (action.type) {
//       case "INCREMENT":
//         return { ...state, count: state.count + 1 };
//       case "DECREMENT":
//         return { ...state, count: state.count - 1 };
//       default:
//         return state;
//     }
//   }
  
  const store = Redux.createStore(
    reducer,
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__() // Enable Redux DevTools
  );
  