import React from 'react';
import CardItem from './CardItem';
import './Cards.css'
import imgURL from '../assets/images/img-9.jpeg';

function Cards() {
  return (
    <div className='cards'>
      <h1>Check out these epic destinations!</h1>
      <div className="cards__container">
        <div className="cards__wrapper">
          <ul className="cards__items">
          <CardItem src={imgURL} text="Explore the hidden waterfall" label='Adventure' path='/services'/>
          <CardItem src={imgURL} text="Explore the hidden waterfall" label='Adventure' path='/services'/>
          </ul>
          <ul className="cards__items">
          <CardItem src={imgURL} text="Explore the hidden waterfall" label='Adventure' path='/services'/>
          <CardItem src={imgURL} text="Explore the hidden waterfall" label='Adventure' path='/services'/>
          <CardItem src={imgURL} text="Explore the hidden waterfall" label='Adventure' path='/services'/>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Cards
