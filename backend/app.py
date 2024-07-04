import os
import json
import pickle
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.preprocessing import MinMaxScaler
from sklearn.decomposition import PCA
from keras.api.models import Sequential
from keras.api.layers import Dense
from keras.api.callbacks import EarlyStopping
from nsga2 import nsga2 as myNSGA   # models i developed
from pso2 import pso as myPSO2


app = Flask(__name__ , static_url_path='/static', static_folder='static')
CORS(app, resources={r"/*": {"origins": "*"}})  # Enable CORS for all routes

# necessary directories exist? WERE MAKING THESE IN THE ROOT DIRECTORY OF OUR FLASK SERVER
os.makedirs("./dataupload", exist_ok=True)
os.makedirs("./static/dataviews", exist_ok=True)
os.makedirs("./static/models", exist_ok=True)

def load_data(file_path):
    try:
        data = pd.read_csv(file_path)
        return data
    except Exception as e:
        print(f"Error loading data: {e}")
        return None

def handle_missing_values(data, choicemanipulate, sub_choicemanipulate):
    choice = choicemanipulate
    replace_choice = sub_choicemanipulate
    try:
        if choice == 'replace':
            if replace_choice == '1':
                data = data.fillna(data.mean())
            elif replace_choice == '2':
                data = data.fillna(data.median())
            
            else:
                raise ValueError("Invalid sub-choice for replacement")
        elif choice == 'drop':
            data = data.dropna(axis=0)
        else:
            raise ValueError("Invalid choice for missing data manipulation")
        return data
    except Exception as e:
        print(f"Error handling missing values: {e}")
        return None

def normalize_data(data):
    try:
        numerical_cols = data.select_dtypes(include=[np.number]).columns
        scaler = MinMaxScaler()
        data[numerical_cols] = scaler.fit_transform(data[numerical_cols])

        return data
    except Exception as e:
        print(f"Error in normalizing data: {e}")
        return None


def apply_pca(data, num_components=20):
    try:
        # Perform PCA
        pca = PCA(n_components=num_components)
        principal_components = pca.fit_transform(data)

        # Save the pca transformer for later use
        with open('./static/models/pca_transformer.pkl', 'wb') as f:
            pickle.dump(pca, f)

        # Get explained variance ratios
        explained_variances = pca.explained_variance_ratio_

        return principal_components, explained_variances
    except Exception as e:
        print(f"Error applying PCA: {e}")
        return None, None

def plot_pca_components(principal_components, explained_variances, plot_file_path):
    try:
        num_components = len(explained_variances)
        component_indices = np.arange(1, num_components + 1)
        
        # Plot explained variance ratios
        plt.figure(figsize=(10, 6))
        plt.bar(component_indices, explained_variances, align='center', alpha=0.8)
        plt.xticks(component_indices)
        plt.xlabel('Principal Components')
        plt.ylabel('Explained Variance Ratio')
        plt.title('Explained Variance Ratio of Principal Components')
        plt.grid(True)
        plt.tight_layout()
        plt.savefig(plot_file_path)
        plt.close()
        
    except Exception as e:
        print(f"Error plotting PCA components: {e}")

def get_userPrefered_objectives(objective_choices, objective_mapping):
    userObjs = objective_choices

    # Validate user input
    if len(userObjs) != 2:
        raise ValueError("Invalid input: You must select exactly two objectives in software testing phase")

    try:
        userObjs = [int(o.strip()) for o in userObjs]
        if any(o <= 0 or o > len(objective_mapping) for o in userObjs):
            raise ValueError("Invalid input: Objective indices must be within range.")
    except ValueError:
        raise ValueError("Invalid input: Please enter valid integers.")
    
    # Map the user input to actual column indices
    selected_indices = [objective_mapping[f'obj{o}'] for o in userObjs]

    return selected_indices

def train_neural_network(X_train, y_train):
    model = Sequential()
    model.add(Dense(64, input_shape=(X_train.shape[1],), activation='relu'))
    model.add(Dense(1, activation='linear'))
    model.compile(optimizer='adam', loss='mean_squared_error')

    early_stopping = EarlyStopping(monitor='val_loss', patience=3, verbose=1, restore_best_weights=True)

    history = model.fit(X_train, y_train, epochs=100, batch_size=32, verbose=1, validation_split=0.2, callbacks=[early_stopping])

    # plt.plot(history.history['loss'], label='Training Loss')
    # plt.plot(history.history['val_loss'], label='Validation Loss')
    # plt.xlabel('Epochs')
    # plt.ylabel('Loss')
    # plt.legend()
    # plt.show()
    
    return model



# ======== DATA PROCESS ROUTE
@app.route('/load_and_processdata', methods=['POST'])
def load_and_processit():
    try:
        # Receive JSON data from the front end
        data = request.get_json()
        
        # Extract data recieved
        input_filename = data.get('input_filename')
        choicemanipulate = data.get('choice_manipulate')
        sub_choicemanipulate = data.get('sub_choice')
        objective_choices = data.get('objectives_chc')

        data = load_data(f"./dataupload/{input_filename}")
        if data is None:
            return jsonify({'error': 'Error loading data'}), 500

        data = handle_missing_values(data, choicemanipulate, sub_choicemanipulate)
        if data is None:
            return jsonify({'error': 'Error handling missing values'}), 500

        data = normalize_data(data)
        if data is None:
            return jsonify({'error': 'Error normalizing data'}), 500

        # NO NEED FOR THIS SAVING ATM
        # processed_file_path = "/content/drive/MyDrive/ColabNotebooks/datasme/nornickelT_data/processed_data.csv"
        # save_data(data, processed_file_path)

        # # THIS MAY BE too much to handle because imagine you have 600 columns this willnot be a good time to draw corrPlots
        # plot_file_path = "/content/drive/MyDrive/ColabNotebooks/datasme/nornickelT_data/corr_plot.png"
        # generate_correlation_plot(data, plot_file_path)

        # Create a mapping of objectives to their column indices
        objective_mapping = {col: idx for idx, col in enumerate(data.columns) if col.startswith('obj')}

        
        # Get Objectives user is interested in optimizing
        selected_variables = get_userPrefered_objectives(objective_choices, objective_mapping)    # now, i am expecting two vars in testing software
        ##
        for var_index in selected_variables:
            # Prepare data for current variable optimization
            objective_variable = data.iloc[:, var_index]
            input_features = data.drop(data.columns[var_index], axis=1)

            # Apply PCA
            num_pca_components = len(input_features.columns)
            input_features_pca, explained_variances = apply_pca(input_features, num_pca_components)

            # Plot first 11 PCA components
            if input_features_pca is not None and explained_variances is not None:
                plot_file_path = f"./static/plots/pca_plot_obj_{var_index}.png"
                plot_pca_components(input_features_pca, explained_variances, plot_file_path)
                
                # Calculate cumulative explained variance
                cumulative_variances = np.cumsum(explained_variances)   #returns a list of the cummulative_sums
                
                # Determine number of components to explain at least 80% variance
                num_components_80 = np.argmax(cumulative_variances >= 0.8) + 1
                
                # Optionally, So We can re-run PCA with the selected number of components if its worth it
                if num_components_80 < len(explained_variances):
                    input_features_pca, explained_variances = apply_pca(input_features, num_components_80)
            
            # NN LEVEL
            # we have our model
            model = train_neural_network(input_features_pca, objective_variable)
            # lets immediately see how model performs
            obj_var_model = model.predict(input_features_pca).flatten()

            # LETS MAKE SOME SAVINGS OF DATA
            obj_out = objective_variable.tolist()
            obj_out_model = obj_var_model.tolist()
            objective_key = None        # for naming sake
            
            # SIMULTANEOUSLY UPDATE DATA INTO BLOCKS FOR LATER USE
            try:
                # to get objkey from objective_mapping
                for key in objective_mapping: 
                    if objective_mapping[key]==var_index:
                        objective_key = key
                        break
                objective_number = objective_key.split('obj')[-1] #number after 'obj'
                file_path_out = f"./static/dataviews/data_objout_{objective_number}.json" ##2
                file_path_out_model = f"./static/dataviews/data_objout_model_{objective_number}.json" ##2

                with open(file_path_out, 'w') as json_file:
                    json.dump({"out": obj_out}, json_file)
                with open(file_path_out_model, 'w') as json_file:
                    json.dump({"out_model": obj_out_model}, json_file)
                    
            except Exception as e:
                print(f"Error populating graphs: {e}")

            
            model_file_path = f"./static/models/model_obj_{var_index}.h5"
            model.save(model_file_path)
            print(f"Model for objective {var_index} saved to {model_file_path}")

            weights_file_path = f"./static/models/model_obj_{var_index}_.weights.h5"
            model.save_weights(weights_file_path)
            print(f"Weights for objective {var_index} saved to {weights_file_path}")
            

        return jsonify({'message': 'Data processed and models trained successfully'}), 200
    
    except Exception as e:
        print(f"Error in /load_and_processdata: {e}")
        return jsonify({'error': 'An error occurred during processing'}), 500

# ======== UPLOAD FILE ROUTE
@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        filepath = os.path.join("./dataupload", file.filename)
        file.save(filepath)

        return jsonify({'filename': file.filename}), 200
    except Exception as e:
        print(f"Error in /upload: {e}")
        return jsonify({'error': 'An error occurred during file upload'}), 500




# ======== ROUTE TO PERFORM MGO (NSGA)
@app.route('/optimize_nsga', methods=['POST'])
def nsga_optimizer():
    pareto_front, pareto_f1, pareto_f2 = myNSGA()
    print('pos: ', pareto_front)
    print('pareto_f1: ', pareto_f1)
    print('pareto_f2: ', pareto_f2)
    return jsonify({
        'pareto_front_individuals': pareto_front,
        'pareto_f1': pareto_f1,
        'pareto_f2': pareto_f2
    }), 200


# ======== ROUTE TO PERFORM MGO (PSO)
'remember that the pso which i use here returns all individuals and not just the pareto' \
'optimal ones: EVEN THOUGH I AM USING PARETO NAMING FOR it as well; just for convinience'

@app.route('/optimize_pso', methods=['POST'])
def pso_optimizer():
    positions, pareto_f1, pareto_f2 = myPSO2()
    print('pareto_front_individuals: ', positions)
    print('pareto_f1: ', pareto_f1)
    print('pareto_f2: ', pareto_f2)
    return jsonify({
        'pareto_front_individuals': positions,
        'pareto_f1': pareto_f1,
        'pareto_f2': pareto_f2
    }), 200




if __name__ == '__main__':
    app.run(debug=True)
