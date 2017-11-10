import React, {Component} from 'react'
// import Select from 'react-select';
import TagsInput from 'react-tagsinput';
import 'react-tagsinput/react-tagsinput.css' // If using WebPack and style-loader.
import './FilterContainer.css'

class FilterContainer extends Component {
  constructor (props) {
    super(props)
    this.state = {
      tags: []
    }
    this.handleMaterialChange = this.handleMaterialChange.bind(this);
  }

  handleMaterialChange(tags) {
    this.setState({
      tags: tags
    })
    this.props.updateFilter(tags)
  }
  render() {
    const inputProps = {
      placeholder: "search " + this.props.label
    }
    return (
      <div className="filter-container">
        <TagsInput value={this.state.tags} inputProps={inputProps} onChange={this.handleMaterialChange} />
      </div>
    );
  }
};

export default FilterContainer;
