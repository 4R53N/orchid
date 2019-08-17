import React, {useState} from 'react';
import axios from 'axios';
import SpinnerComponent from './spinner.component';
import '../stylesheets/listing.scss';
import '../stylesheets/inventory.scss';
import '../stylesheets/detail.scss';
import productSVG from '../img/svg/product.svg';
import async from 'async';

export default class InventoryComponent extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            products: [],
            fetching: true,
            searchString: '',
            isAddingProduct: false,
            filters: {
                minPrice: null,
                maxPrice: null,
                minQuantity: null,
                maxQuantity: null,
                categories: [],
                tags: []
            }
        }  
        this.componentDidMount=this.componentDidMount.bind(this);
        this.handleCheck = this.handleCheck.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
        this.toggleDetail = this.toggleDetail.bind(this);
    }
    componentDidMount(){
        axios.get('http://localhost:3001/inventory/').then((response) => {
            if(response.status === 200){
                var prods = response.data;
                console.log(prods);
                prods.forEach(element => {
                    element.checked = false;
                });
                this.setState({products: prods, fetching: false});
            }
            }).catch(err => {
                this.setState({products: [], fetching: false});
          });
    }

    handleCheck(e){
        var index = this.state.products.indexOf(this.state.products.find(product=>product._id == e.target.parentNode.lastChild.value));
        var stateBuf = this.state;
        stateBuf.products[index].checked = !stateBuf.products[index].checked;
        this.setState(stateBuf);
    }
    
    handleDelete(e){
        var prods = this.state.products.filter((val) => val.checked).map((val) => val._id);
        if(prods.length === 0) return;
         this.setState({fetching: true});
          axios.delete('http://localhost:3001/inventory/', {data: {products: prods}})
          .then((response) => {
            this.setState({products: response.data, fetching: false});
            })
          .catch(err => console.log(err));
    }

    

    toggleDetail(){
        this.setState({isAddingProduct: !this.state.isAddingProduct});
        axios.get('http://localhost:3001/inventory/new');
    }

    render(){
    return (this.state.fetching? <SpinnerComponent /> : (
        <div className="inventory-container">
            <h1>INVENTORY</h1>
            <ul className="button-list">
            {this.state.products.map((val)=><li key={val._id}><ProductButtonComponent product={val} handleCheck={this.handleCheck}/></li>)}
            </ul>
            <div className="button-bar">
            <button id="delete" onClick={this.handleDelete}>Delete</button>
            <button className="submit-button" onClick={this.toggleDetail}>Add Product</button>
            </div>
            {this.state.isAddingProduct ? <div onClick={this.toggleDetail} className='backdrop'> <ProductDetail/></div> : null}
        </div>
    ));
    }
}

function ProductDetail(props){
    const [newProduct, setNewProduct] = useState(0);
    function handleAddProduct(e){
        e.preventDefault();
    }
    function handleImageUpload(file){
        let {image, ...olState} = newProduct; 
        setNewProduct({
            ...olState,
            image: file
        });
    }
    return(
    <div onClick={(e)=>e.stopPropagation()} className = 'detail-div'>
            <div className="detail-top-bar">
                <DetailInfoFields/>
                <ImageUpload imageFile={newProduct.image || ''} updateImage={handleImageUpload}/>
            </div>
            <div className="detail-submit-bar">
                <input type="submit" onClick={handleAddProduct} value='ADD' className="submit-button"/>   
            </div>
    </div>
    );
}

function SumbitBar(props){

}

function DetailInfoFields(props){
    return(
        <div className="detail-info-fields">
            <label for='name'>Name</label>
            <input type="text" id="name" style={{width: '100%'}} value={props.product ? props.product.name : ''}/>
            <label for='sku'>SKU</label>
            <input type="text" id="sku" style={{width: '100%'}} value={props.product ? props.product.sku : ''}/>
            <label for='price'>Price</label>
            <input type="number" id="price"min={0} step={0.01} style={{width: '30%'}} value={props.product && props.product.price}/>
        </div>
    );
}

function ImageUpload(props) {
    let urls = new WeakMap()

    let blobUrl = blob => {
      if (urls.has(blob)) {
        return urls.get(blob)
      } else {
        let url = URL.createObjectURL(blob)
        urls.set(blob, url)
        return url
      }
    }

    
    
    let onDrag = event => {
        event.preventDefault();
      }
    
    let onDrop = event => {
        event.preventDefault();
        let file = event.dataTransfer.files[0];
        props.updateImage(file);
    }

    let onClick = event => {
        event.stopPropagation();
        if(event.target.tagName=='DIV')
            event.target.lastChild.click();
        else if(event.target.tagName=='IMG')
            event.target.parentNode.lastChild.click();
    }

    let onChange = event => {
        event.preventDefault();
        let file = event.target.files[0];
        props.updateImage(file);
    }

    let file  = props.imageFile;
    let url = file && blobUrl(file)
      return (
        <div className="detail-image-banner" onDragOver={onDrag} onDrop={onDrop} onClick={onClick}>
            <img src={url} onClick={onClick} alt="Drop an image!"/>
            <input type = "file" onChange={onChange} accept="image/x-png,image/gif,image/jpeg" style={{display: 'none'}}/>
        </div>
        
      );
  }

function ProductButtonComponent(props){
    function handleMouseDown(e){
        if(e.target.className=='listing-button'){
            e.target.className = 'listing-button clicked';
        }
    }  
    function handleMouseUp(e){
        if(e.target.className=='listing-button clicked'){
            e.target.className = 'listing-button';
        }
    }
    return(
        <div 
        className="listing-button" 
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}>
        <input type="checkbox" onClick={props.handleCheck} onMouseDown={(e)=>e.stopPropagation()} onMouseUp={(e)=>e.stopPropagation()}/>
        <img src={productSVG} width='40px' height='40px'/>
        <p>{props.product.name}</p>
        <p>{props.product.price}</p>
        <p>{props.product.quantities.reduce((acc=0, val) => acc+val.quantity, 0)}</p>
        <p>{props.product.cost}</p>
        <p>{props.product.sku}</p>
        <input id='productID' type='hidden' value={props.product._id}/>
        </div> 
    );
}